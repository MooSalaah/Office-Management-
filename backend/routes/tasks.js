const express = require('express');
const router = express.Router();

// Simple test route without database
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/tasks - Test route');
    res.json({ success: true, data: [], message: 'Tasks API is working' });
  } catch (err) {
    console.error('Error in tasks route:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get task by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/tasks/:id - Test route');
    res.json({ success: true, data: null, message: 'Task by ID API is working' });
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new task (public for testing)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/tasks - Test route', req.body);
    res.status(201).json({ success: true, data: req.body, message: 'Task creation API is working' });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update task (public for testing)
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/tasks/:id - Test route', req.body);
    res.json({ success: true, data: req.body, message: 'Task update API is working' });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete task (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/tasks/:id - Test route');
    res.json({ success: true, message: 'Task deletion API is working' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 