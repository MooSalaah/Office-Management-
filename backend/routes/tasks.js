const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
require('dotenv').config();
const fetch = require('node-fetch');

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Get all tasks (public for testing)
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get task by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new task (public for testing)
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    const newTask = await task.save();
    
    // Create notification for task assignment
    if (newTask.assigneeId && newTask.assigneeId !== newTask.createdBy) {
      try {
        const Notification = require('../models/Notification');
        const notification = new Notification({
          userId: newTask.assigneeId,
          title: "مهمة جديدة مسندة إليك",
          message: `تم إسناد مهمة جديدة إليك: "${newTask.title}"`,
          type: "task",
          isRead: false,
          actionUrl: `/tasks`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await notification.save();
        logger.info('Notification created for task assignment', { 
          taskId: newTask.id, 
          assigneeId: newTask.assigneeId,
          notificationId: notification._id 
        }, 'TASKS');
      } catch (notificationError) {
        logger.error('Failed to create notification for task assignment', { 
          error: notificationError.message,
          taskId: newTask.id 
        }, 'TASKS');
      }
    }
    
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'create',
          data: newTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'TASKS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'TASKS');
    }
    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update task (public for testing)
router.put('/:id', async (req, res) => {
  try {
    // Get the original task to compare assignee
    const originalTask = await Task.findById(req.params.id);
    if (!originalTask) return res.status(404).json({ success: false, error: 'Task not found' });
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    // Send notifications for task updates
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      
      // Get user who updated the task
      const updatedBy = req.body.updatedBy || req.user?.id || 'system';
      const updatedByName = req.body.updatedByName || req.user?.name || 'مستخدم';
      
      // 1. Notification for assignee change
      if (originalTask.assigneeId !== updatedTask.assigneeId && updatedTask.assigneeId) {
        const assignee = await User.findOne({ 
          $or: [{ id: updatedTask.assigneeId }, { _id: updatedTask.assigneeId }] 
        });
        
        if (assignee) {
          const notification = new Notification({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: assignee._id.toString(),
            title: "مهمة مسندة إليك",
            message: `تم إسناد مهمة "${updatedTask.title}" إليك بواسطة ${updatedByName}`,
            type: "task",
            isRead: false,
            actionUrl: `/tasks`,
            triggeredBy: updatedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          await notification.save();
          
          logger.info('Notification sent for task reassignment', { 
            taskId: updatedTask.id, 
            assigneeId: updatedTask.assigneeId,
            assigneeName: assignee.name,
            notificationId: notification._id 
          }, 'TASKS');
        }
      }
      
      // 2. Notification for status change
      if (originalTask.status !== updatedTask.status) {
        const statusText = {
          'todo': 'قيد الانتظار',
          'in-progress': 'قيد التنفيذ',
          'completed': 'مكتملة',
          'cancelled': 'ملغية'
        };
        
        // Notify assignee about status change
        if (updatedTask.assigneeId && updatedTask.assigneeId !== updatedBy) {
          const assignee = await User.findOne({ 
            $or: [{ id: updatedTask.assigneeId }, { _id: updatedTask.assigneeId }] 
          });
          
          if (assignee) {
            const notification = new Notification({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              userId: assignee._id.toString(),
              title: "تحديث حالة المهمة",
              message: `تم تحديث حالة مهمة "${updatedTask.title}" إلى ${statusText[updatedTask.status] || updatedTask.status} بواسطة ${updatedByName}`,
              type: "task",
              isRead: false,
              actionUrl: `/tasks`,
              triggeredBy: updatedBy,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            await notification.save();
          }
        }
        
        // Notify task creator about status change
        if (updatedTask.createdBy && updatedTask.createdBy !== updatedBy) {
          const creator = await User.findOne({ 
            $or: [{ id: updatedTask.createdBy }, { _id: updatedTask.createdBy }] 
          });
          
          if (creator) {
            const notification = new Notification({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              userId: creator._id.toString(),
              title: "تحديث حالة مهمة",
              message: `تم تحديث حالة مهمة "${updatedTask.title}" إلى ${statusText[updatedTask.status] || updatedTask.status} بواسطة ${updatedByName}`,
              type: "task",
              isRead: false,
              actionUrl: `/tasks`,
              triggeredBy: updatedBy,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            await notification.save();
          }
        }
      }
      
      // 3. Notification for priority change
      if (originalTask.priority !== updatedTask.priority) {
        const priorityText = {
          'low': 'منخفضة',
          'medium': 'متوسطة',
          'high': 'عالية',
          'urgent': 'عاجلة'
        };
        
        // Notify assignee about priority change
        if (updatedTask.assigneeId && updatedTask.assigneeId !== updatedBy) {
          const assignee = await User.findOne({ 
            $or: [{ id: updatedTask.assigneeId }, { _id: updatedTask.assigneeId }] 
          });
          
          if (assignee) {
            const notification = new Notification({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              userId: assignee._id.toString(),
              title: "تحديث أولوية المهمة",
              message: `تم تحديث أولوية مهمة "${updatedTask.title}" إلى ${priorityText[updatedTask.priority] || updatedTask.priority} بواسطة ${updatedByName}`,
              type: "task",
              isRead: false,
              actionUrl: `/tasks`,
              triggeredBy: updatedBy,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            await notification.save();
          }
        }
      }
      
    } catch (notificationError) {
      logger.error('Failed to send task update notifications', { 
        error: notificationError.message,
        taskId: updatedTask.id 
      }, 'TASKS');
    }
    
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'update',
          data: updatedTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'TASKS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'TASKS');
    }
    res.json({ success: true, data: updatedTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete task (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ success: false, error: 'Task not found' });
    
    // Send notifications for task deletion
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      
      // Get user who deleted the task
      const deletedBy = req.body.deletedBy || req.user?.id || 'system';
      const deletedByName = req.body.deletedByName || req.user?.name || 'مستخدم';
      
      // Notify assignee about task deletion
      if (deletedTask.assigneeId && deletedTask.assigneeId !== deletedBy) {
        const assignee = await User.findOne({ 
          $or: [{ id: deletedTask.assigneeId }, { _id: deletedTask.assigneeId }] 
        });
        
        if (assignee) {
          const notification = new Notification({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: assignee._id.toString(),
            title: "تم حذف مهمة مسندة إليك",
            message: `تم حذف مهمة "${deletedTask.title}" بواسطة ${deletedByName}`,
            type: "task",
            isRead: false,
            actionUrl: `/tasks`,
            triggeredBy: deletedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          await notification.save();
        }
      }
      
      // Notify task creator about task deletion
      if (deletedTask.createdBy && deletedTask.createdBy !== deletedBy) {
        const creator = await User.findOne({ 
          $or: [{ id: deletedTask.createdBy }, { _id: deletedTask.createdBy }] 
        });
        
        if (creator) {
          const notification = new Notification({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: creator._id.toString(),
            title: "تم حذف مهمة أنشأتها",
            message: `تم حذف مهمة "${deletedTask.title}" بواسطة ${deletedByName}`,
            type: "task",
            isRead: false,
            actionUrl: `/tasks`,
            triggeredBy: deletedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          await notification.save();
        }
      }
      
      logger.info('Notifications sent for task deletion', { 
        taskId: deletedTask.id,
        taskTitle: deletedTask.title,
        deletedBy: deletedByName
      }, 'TASKS');
    } catch (notificationError) {
      logger.error('Failed to send task deletion notifications', { 
        error: notificationError.message,
        taskId: deletedTask.id 
      }, 'TASKS');
    }
    
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'delete',
          data: deletedTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 