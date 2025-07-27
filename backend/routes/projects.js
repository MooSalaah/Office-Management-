const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const fetch = require('node-fetch');
const Task = require('../models/Task');
const TaskType = require('../models/TaskType');
require('dotenv').config();

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

// Get all projects (public for testing)
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get project by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new project (public for testing)
router.post('/', async (req, res) => {
  try {
    console.log('=== PROJECT CREATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { project, tasks, createdByName } = req.body;
    const projectData = project || req.body; // Fallback for backward compatibility
    
    console.log('Project data:', JSON.stringify(projectData, null, 2));
    console.log('Tasks data:', JSON.stringify(tasks, null, 2));
    console.log('Created by name:', createdByName);
    
    const newProject = await new Project(projectData).save();
    console.log('Project saved successfully:', newProject.id);
    
    // Create tasks for the project
    let createdTasks = [];
    if (Array.isArray(tasks) && tasks.length > 0) {
      console.log(`Creating ${tasks.length} tasks for project ${newProject.id}`);
      
      for (const t of tasks) {
        console.log('Processing task:', JSON.stringify(t, null, 2));
        
        // Get task type info
        const type = await TaskType.findById(t.typeId);
        if (!type) {
          console.log(`TaskType not found for ID: ${t.typeId}`);
          continue;
        }
        console.log('Found task type:', type.name);
        
        // Create task
        const task = new Task({
          id: Date.now().toString() + Math.floor(Math.random()*10000),
          title: type.name,
          description: type.description,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeName || '',
          projectId: newProject.id,
          projectName: newProject.name,
          priority: 'medium',
          status: 'todo',
          dueDate: '',
          createdBy: newProject.createdBy,
          createdByName: createdByName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        const savedTask = await task.save();
        createdTasks.push(savedTask);
        console.log('Task created successfully:', savedTask.id);
        
        // Send notification to assignee
        if (t.assigneeId) {
          try {
            const Notification = require('../models/Notification');
            const notification = new Notification({
              userId: t.assigneeId,
              title: `مهمة جديدة في مشروع: ${newProject.name}`,
              message: `تم إسناد مهمة "${type.name}" إليك في المشروع "${newProject.name}"`,
              type: "task",
              isRead: false,
              actionUrl: `/tasks`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            await notification.save();
            console.log('Notification created for task assignment');
          } catch (notificationError) {
            logger.error('Failed to create notification for task assignment', {
              error: notificationError.message,
              taskId: savedTask.id
            }, 'PROJECTS');
          }
        }
      }
    } else {
      console.log('No tasks to create');
    }
    
    console.log(`Project creation completed. Created ${createdTasks.length} tasks.`);
    res.status(201).json({ success: true, data: newProject, tasks: createdTasks });
  } catch (err) {
    console.error('Error creating project:', err);
    logger.error('Error creating project', { error: err.message }, 'PROJECTS');
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update project (public for testing)
router.put('/:id', async (req, res) => {
  try {
    // Get the original project to compare assigned engineer
    const originalProject = await Project.findOne({ id: req.params.id });
    if (!originalProject) return res.status(404).json({ success: false, error: 'Project not found' });
    
    const updatedProject = await Project.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    
    // Send notifications for various project updates
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      
      // Get user who updated the project
      const updatedBy = req.body.updatedBy || req.user?.id || 'system';
      const updatedByName = req.body.updatedByName || req.user?.name || 'مستخدم';
      
      // 1. Notification for assigned engineer change
      if (originalProject.assignedEngineerId !== updatedProject.assignedEngineerId && updatedProject.assignedEngineerId) {
        const engineer = await User.findOne({ 
          $or: [{ id: updatedProject.assignedEngineerId }, { _id: updatedProject.assignedEngineerId }] 
        });
        
        if (engineer) {
          const notification = new Notification({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: engineer._id.toString(),
            title: "مشروع مسند إليك",
            message: `تم إسناد مشروع "${updatedProject.name}" إليك بواسطة ${updatedByName}`,
            type: "project",
            isRead: false,
            actionUrl: `/projects`,
            triggeredBy: updatedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          await notification.save();
          
          logger.info('Notification sent for project reassignment', { 
            projectId: updatedProject.id, 
            engineerId: updatedProject.assignedEngineerId,
            engineerName: engineer.name,
            notificationId: notification._id 
          }, 'PROJECTS');
        }
      }
      
      // 2. Notification for status change
      if (originalProject.status !== updatedProject.status) {
        const statusText = {
          'in-progress': 'قيد التنفيذ',
          'completed': 'مكتمل',
          'on-hold': 'معلق',
          'cancelled': 'ملغي'
        };
        
        // Notify all team members about status change
        if (updatedProject.team && Array.isArray(updatedProject.team)) {
          for (const teamMemberId of updatedProject.team) {
            if (teamMemberId !== updatedBy) {
              const teamMember = await User.findOne({ 
                $or: [{ id: teamMemberId }, { _id: teamMemberId }] 
              });
              
              if (teamMember) {
                const notification = new Notification({
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  userId: teamMember._id.toString(),
                  title: "تحديث حالة المشروع",
                  message: `تم تحديث حالة مشروع "${updatedProject.name}" إلى ${statusText[updatedProject.status] || updatedProject.status} بواسطة ${updatedByName}`,
                  type: "project",
                  isRead: false,
                  actionUrl: `/projects`,
                  triggeredBy: updatedBy,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
                await notification.save();
              }
            }
          }
        }
      }
      
      // 3. Notification for team changes
      const originalTeam = originalProject.team || [];
      const updatedTeam = updatedProject.team || [];
      const newTeamMembers = updatedTeam.filter(id => !originalTeam.includes(id));
      const removedTeamMembers = originalTeam.filter(id => !updatedTeam.includes(id));
      
      // Notify new team members
      for (const newMemberId of newTeamMembers) {
        if (newMemberId !== updatedBy) {
          const newMember = await User.findOne({ 
            $or: [{ id: newMemberId }, { _id: newMemberId }] 
          });
          
          if (newMember) {
            const notification = new Notification({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              userId: newMember._id.toString(),
              title: "تم إضافتك لفريق مشروع",
              message: `تم إضافتك لفريق مشروع "${updatedProject.name}" بواسطة ${updatedByName}`,
              type: "project",
              isRead: false,
              actionUrl: `/projects`,
              triggeredBy: updatedBy,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            await notification.save();
          }
        }
      }
      
      // Notify removed team members
      for (const removedMemberId of removedTeamMembers) {
        if (removedMemberId !== updatedBy) {
          const removedMember = await User.findOne({ 
            $or: [{ id: removedMemberId }, { _id: removedMemberId }] 
          });
          
          if (removedMember) {
            const notification = new Notification({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              userId: removedMember._id.toString(),
              title: "تم إزالتك من فريق مشروع",
              message: `تم إزالتك من فريق مشروع "${updatedProject.name}" بواسطة ${updatedByName}`,
              type: "project",
              isRead: false,
              actionUrl: `/projects`,
              triggeredBy: updatedBy,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            await notification.save();
          }
        }
      }
      
    } catch (notificationError) {
      logger.error('Failed to send project update notifications', { 
        error: notificationError.message,
        projectId: updatedProject.id 
      }, 'PROJECTS');
    }
    
    res.json({ success: true, data: updatedProject });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete project (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedProject = await Project.findOneAndDelete({ id: req.params.id });
    if (!deletedProject) return res.status(404).json({ success: false, error: 'Project not found' });
    
    // Send notifications to all team members about project deletion
    if (deletedProject.team && Array.isArray(deletedProject.team)) {
      try {
        const Notification = require('../models/Notification');
        const User = require('../models/User');
        
        // Get user who deleted the project (from request or default to system)
        const deletedBy = req.body.deletedBy || req.user?.id || 'system';
        const deletedByName = req.body.deletedByName || req.user?.name || 'مستخدم';
        
        for (const teamMemberId of deletedProject.team) {
          if (teamMemberId !== deletedBy) { // Don't notify the person who deleted
            const teamMember = await User.findOne({ 
              $or: [{ id: teamMemberId }, { _id: teamMemberId }] 
            });
            
            if (teamMember) {
              const notification = new Notification({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                userId: teamMember._id.toString(),
                title: "تم حذف مشروع كنت مسؤول عنه",
                message: `تم حذف مشروع "${deletedProject.name}" بواسطة ${deletedByName}`,
                type: "project",
                isRead: false,
                actionUrl: `/projects`,
                triggeredBy: deletedBy,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              await notification.save();
              
              logger.info(`Notification sent to ${teamMember.name} about project deletion`, {
                projectId: deletedProject.id,
                projectName: deletedProject.name,
                userId: teamMember._id,
                userName: teamMember.name
              }, 'PROJECTS');
            }
          }
        }
      } catch (notificationError) {
        logger.error('Failed to send project deletion notifications', {
          error: notificationError.message,
          projectId: deletedProject.id
        }, 'PROJECTS');
      }
    }
    
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 