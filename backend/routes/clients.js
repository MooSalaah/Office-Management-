const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fetch = require('node-fetch');

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

// Get all clients (public for testing)
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find();
    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get client by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new client (public for testing)
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    const newClient = await client.save();
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client',
          action: 'create',
          data: newClient,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.status(201).json({ success: true, data: newClient });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update client (public for testing)
router.put('/:id', async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClient) return res.status(404).json({ success: false, error: 'Client not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client',
          action: 'update',
          data: updatedClient,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.json({ success: true, data: updatedClient });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete client (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) return res.status(404).json({ success: false, error: 'Client not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client',
          action: 'delete',
          data: deletedClient,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 