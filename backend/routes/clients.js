const express = require('express');
const router = express.Router();

// Simple test route without database
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/clients - Test route');
    res.json({ success: true, data: [], message: 'Clients API is working' });
  } catch (err) {
    console.error('Error in clients route:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get client by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/clients/:id - Test route');
    res.json({ success: true, data: null, message: 'Client by ID API is working' });
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new client (public for testing)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/clients - Test route', req.body);
    res.status(201).json({ success: true, data: req.body, message: 'Client creation API is working' });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update client (public for testing)
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/clients/:id - Test route', req.body);
    res.json({ success: true, data: req.body, message: 'Client update API is working' });
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete client (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/clients/:id - Test route');
    res.json({ success: true, message: 'Client deletion API is working' });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 