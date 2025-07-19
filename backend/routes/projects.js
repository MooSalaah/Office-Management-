const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
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
  const { name, client, description, startDate, endDate, status, notes } = req.body;
  const project = new Project({ name, client, description, startDate, endDate, status, notes });
  try {
    const newProject = await project.save();
    
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'project',
          action: 'create',
          data: newProject,
          userId: 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    
    res.status(201).json({ success: true, data: newProject });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update project (public for testing)
router.put('/:id', async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProject) return res.status(404).json({ success: false, error: 'Project not found' });
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