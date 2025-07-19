const express = require('express');
const router = express.Router();

// Simple test route without database
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/projects - Test route');
    res.json({ success: true, data: [], message: 'Projects API is working' });
  } catch (err) {
    console.error('Error in projects route:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get project by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/projects/:id - Test route');
    res.json({ success: true, data: null, message: 'Project by ID API is working' });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new project (public for testing)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/projects - Test route', req.body);
    res.status(201).json({ success: true, data: req.body, message: 'Project creation API is working' });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update project (public for testing)
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/projects/:id - Test route', req.body);
    res.json({ success: true, data: req.body, message: 'Project update API is working' });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete project (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/projects/:id - Test route');
    res.json({ success: true, message: 'Project deletion API is working' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 