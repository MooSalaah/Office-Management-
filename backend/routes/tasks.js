const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
require('dotenv').config();
const fetch = require('node-fetch');
const mongoose = require('mongoose');

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

// Helper to find task by ID (ObjectId or custom String ID)
async function findTask(id) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  if (isObjectId) {
    return await Task.findById(id);
  } else {
    return await Task.findOne({ id: id });
  }
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
    const task = await findTask(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new task
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
      } catch (notificationError) {
        logger.error('Failed to create notification', { error: notificationError.message }, 'TASKS');
      }
    }

    // Broadcast
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
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'TASKS');
    }

    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    let updatedTask;

    // Strict check for MongoDB ObjectId (24 hex characters)
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id) && /^[0-9a-fA-F]{24}$/.test(req.params.id);

    if (isObjectId) {
      try {
        console.log(`DEBUG: Updating task with ObjectId: ${req.params.id}`);
        res.setHeader('X-Debug-Lookup-Type', 'ObjectId');
        updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
      } catch (error) {
        console.log(`DEBUG: CastError caught, falling back to Custom ID: ${req.params.id}`);
        // If cast failed, try custom ID
        updatedTask = await Task.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
      }
    } else {
      console.log(`DEBUG: Updating task with Custom ID: ${req.params.id}`);
      res.setHeader('X-Debug-Lookup-Type', 'CustomID');
      updatedTask = await Task.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    }
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'project',
      action: 'update',
      data: updatedProject,
      userId: req.user ? req.user.id : 'system',
      timestamp: Date.now()
    })
  });
        } catch (broadcastError) {
  logger.error('Project broadcast error', { error: broadcastError.message }, 'TASKS');
}

// Notify Project Manager if task is completed
if (req.body.status === 'completed') {
  try {
    const Notification = require('../models/Notification');
    // Notify assigned engineer (Project Manager)
    if (updatedProject.assignedEngineerId && updatedProject.assignedEngineerId !== req.user.id) {
      const notification = new Notification({
        userId: updatedProject.assignedEngineerId,
        title: "تم إكمال مهمة",
        message: `تم إكمال المهمة "${updatedTask.title}" في مشروع "${updatedProject.name}"`,
        type: "task_completed",
        isRead: false,
        actionUrl: `/projects`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await notification.save();

      // Broadcast notification
      await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notification',
          action: 'create',
          data: notification,
          userId: 'system',
          timestamp: Date.now()
        })
      });
    }
  } catch (notificationError) {
    logger.error('Failed to create completion notification', { error: notificationError.message }, 'TASKS');
  }
}
      }
    }

// Broadcast Task Update
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
} catch (broadcastError) {
  logger.error('Broadcast error', { error: broadcastError.message }, 'TASKS');
}

res.json({ success: true, data: updatedTask });
  } catch (err) {
  res.status(500).json({ success: false, error: err.message });
}
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    let deletedTask;

    // Strict check for MongoDB ObjectId (24 hex characters)
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id) && /^[0-9a-fA-F]{24}$/.test(req.params.id);

    if (isObjectId) {
      deletedTask = await Task.findByIdAndDelete(req.params.id);
    } else {
      deletedTask = await Task.findOneAndDelete({ id: req.params.id });
    }

    if (!deletedTask) return res.status(404).json({ success: false, error: 'Task not found' });

    // Update Project Progress
    if (deletedTask.projectId) {
      const Project = require('../models/Project');
      const projectTasks = await Task.find({ projectId: deletedTask.projectId });
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Update project status based on progress
      let statusUpdate = {};
      if (progress === 100 && totalTasks > 0) {
        statusUpdate = { progress, status: 'completed' };
      } else {
        statusUpdate = { progress, status: 'in-progress' };
      }

      const updatedProject = await Project.findByIdAndUpdate(deletedTask.projectId, statusUpdate, { new: true });

      // Broadcast Project Update
      if (updatedProject) {
        try {
          await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'project',
              action: 'update',
              data: updatedProject,
              userId: req.user ? req.user.id : 'system',
              timestamp: Date.now()
            })
          });
        } catch (broadcastError) {
          logger.error('Project broadcast error', { error: broadcastError.message }, 'TASKS');
        }
      }
    }

    // Broadcast Task Delete
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
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'TASKS');
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;