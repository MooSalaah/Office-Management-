const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
require('dotenv').config();
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const { updateProject } = require('../controllers/projectController');

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

// Helper to find project by ID
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
    const { id, ...projectData } = req.body;
    const project = new Project(projectData);
    const newProject = await project.save();
    res.status(201).json({ success: true, data: newProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update project using new controller logic
router.put('/:id', updateProject);

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
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sync project status
router.post('/sync-status', async (req, res) => {
  try {
    const projects = await Project.find();
    let updatedCount = 0;

    for (const project of projects) {
      const tasks = await Task.find({ projectId: project._id });
      if (tasks.length > 0) {
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completedTasks / tasks.length) * 100);

        let newStatus = project.status;
        if (progress === 100) newStatus = 'completed';
        else if (progress > 0 && newStatus === 'draft') newStatus = 'in-progress';
        else if (progress < 100 && newStatus === 'completed') newStatus = 'in-progress';

        if (progress !== project.progress || newStatus !== project.status) {
          project.progress = progress;
          project.status = newStatus;
          await project.save();
          updatedCount++;
        }
      }
    }

    res.json({ success: true, message: `Synced ${updatedCount} projects` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
