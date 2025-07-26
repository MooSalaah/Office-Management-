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
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new project (public for testing)
router.post('/', async (req, res) => {
  try {
    const { project, tasks, createdByName } = req.body;
    const projectData = project || req.body; // Fallback for backward compatibility
    
    const newProject = await new Project(projectData).save();
    
    // Create tasks for the project
    let createdTasks = [];
    if (Array.isArray(tasks) && tasks.length > 0) {
      for (const t of tasks) {
        // Get task type info
        const type = await TaskType.findById(t.typeId);
        if (!type) continue;
        
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
          } catch (notificationError) {
            logger.error('Failed to create notification for task assignment', {
              error: notificationError.message,
              taskId: savedTask.id
            }, 'PROJECTS');
          }
        }
      }
    }
    
    res.status(201).json({ success: true, data: newProject, tasks: createdTasks });
  } catch (err) {
    logger.error('Error creating project', { error: err.message }, 'PROJECTS');
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update project (public for testing)
router.put('/:id', async (req, res) => {
  try {
    // Get the original project to compare assigned engineer
    const originalProject = await Project.findById(req.params.id);
    if (!originalProject) return res.status(404).json({ success: false, error: 'Project not found' });
    
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    // Create notification if assigned engineer changed
    if (originalProject.assignedEngineerId !== updatedProject.assignedEngineerId && updatedProject.assignedEngineerId) {
      try {
        const Notification = require('../models/Notification');
        const notification = new Notification({
          userId: updatedProject.assignedEngineerId,
          title: "مشروع مسند إليك",
          message: `تم إسناد مشروع إليك: "${updatedProject.name}"`,
          type: "project",
          isRead: false,
          actionUrl: `/projects`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await notification.save();
        logger.info('Notification created for project reassignment', { 
          projectId: updatedProject.id, 
          engineerId: updatedProject.assignedEngineerId,
          notificationId: notification._id 
        }, 'PROJECTS');
      } catch (notificationError) {
        logger.error('Failed to create notification for project reassignment', { 
          error: notificationError.message,
          projectId: updatedProject.id 
        }, 'PROJECTS');
      }
    }
    
    res.json({ success: true, data: updatedProject });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete project (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 