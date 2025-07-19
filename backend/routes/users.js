const express = require('express');
const router = express.Router();

// Simple test route without database
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/users - Test route');
    res.json({ success: true, data: [], message: 'Users API is working' });
  } catch (err) {
    console.error('Error in users route:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/users/:id - Test route');
    res.json({ success: true, data: null, message: 'User by ID API is working' });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new user (public for testing)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/users - Test route', req.body);
    res.status(201).json({ success: true, data: req.body, message: 'User creation API is working' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update user (public for testing)
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/users/:id - Test route', req.body);
    res.json({ success: true, data: req.body, message: 'User update API is working' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete user (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/users/:id - Test route');
    res.json({ success: true, message: 'User deletion API is working' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 