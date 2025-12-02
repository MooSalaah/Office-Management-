const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
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

// Helper to find project by ID (ObjectId or custom String ID)
async function findProject(id) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  if (isObjectId) {
    return await Project.findById(id);
  } else {
    return await Project.findOne({ id: id });
  }
}

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await findProject(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const project = new Project(req.body);
    const newProject = await project.save();

    // Broadcast
    try {
      await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project',
          action: 'create',
          data: newProject,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'PROJECTS');
    }

    res.status(201).json({ success: true, data: newProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    let updatedProject;
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id) && /^[0-9a-fA-F]{24}$/.test(req.params.id);

    if (isObjectId) {
      updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    } else {
      updatedProject = await Project.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    }

    if (!updatedProject) return res.status(404).json({ success: false, error: 'Project not found' });

    // If project is marked as completed, mark all its tasks as completed
    if (req.body.status === 'completed') {
      try {
        const projectId = updatedProject.id; // This is the custom ID string usually
        const projectObjectId = updatedProject._id;

        console.log(`DEBUG: Project completed. Updating tasks for ProjectId: ${projectId} and ObjectId: ${projectObjectId}`);

        // Update tasks where projectId matches custom ID
        const updateResult1 = await Task.updateMany(
          { projectId: projectId },
          { $set: { status: 'completed', progress: 100 } }
        );
        console.log(`DEBUG: Updated ${updateResult1.modifiedCount} tasks by custom ID`);

        // Update tasks where projectId matches ObjectId (if different)
        if (projectObjectId.toString() !== projectId) {
          const updateResult2 = await Task.updateMany(
            { projectId: projectObjectId.toString() },
            { $set: { status: 'completed', progress: 100 } }
          );
          console.log(`DEBUG: Updated ${updateResult2.modifiedCount} tasks by ObjectId`);
        }

      } catch (taskUpdateError) {
        logger.error('Failed to auto-complete tasks', { error: taskUpdateError.message }, 'PROJECTS');
      }
    }

    // Broadcast
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
      logger.error('Broadcast error', { error: broadcastError.message }, 'PROJECTS');
    }

    res.json({ success: true, data: updatedProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    let deletedProject;
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id) && /^[0-9a-fA-F]{24}$/.test(req.params.id);

    if (isObjectId) {
      deletedProject = await Project.findByIdAndDelete(req.params.id);
    } else {
      deletedProject = await Project.findOneAndDelete({ id: req.params.id });
    }

    if (!deletedProject) return res.status(404).json({ success: false, error: 'Project not found' });

    // Broadcast
    try {
      await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project',
          action: 'delete',
          data: deletedProject,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'PROJECTS');
    }

    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sync project status (check if all tasks are completed)
router.post('/sync-status', async (req, res) => {
  try {
    const projects = await Project.find();
    let updatedCount = 0;

    for (const project of projects) {
      // Find tasks for this project
      const tasks = await Task.find({
        $or: [
          { projectId: project.id },
          { projectId: project._id.toString() }
        ]
      });

      if (tasks.length > 0) {
        const allCompleted = tasks.every(t => t.status === 'completed');

        if (allCompleted && project.status !== 'completed') {
          project.status = 'completed';
          project.progress = 100;
          await project.save();
          updatedCount++;
        }
      }
    }

    res.json({ success: true, updatedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
