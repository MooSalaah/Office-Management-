const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Get all projects (public for testing)
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json({ success: true, data: projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
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
    console.error('Error fetching project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new project (public for testing)
router.post('/', async (req, res) => {
  try {
    const { name, client, description, startDate, endDate, status, notes } = req.body;
    const project = new Project({ name, client, description, startDate, endDate, status, notes });
    const newProject = await project.save();
    res.status(201).json({ success: true, data: newProject });
  } catch (err) {
    console.error('Error creating project:', err);
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
    console.error('Error updating project:', err);
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
    console.error('Error deleting project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 