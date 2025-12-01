const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
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

// Helper to find client by ID (ObjectId or custom String ID)
async function findClient(id) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  if (isObjectId) {
    return await Client.findById(id);
  } else {
    return await Client.findOne({ id: id });
  }
}

// Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find();
    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await findClient(req.params.id);
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new client
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    const newClient = await client.save();

    // Broadcast
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
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }

    res.status(201).json({ success: true, data: newClient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    let updatedClient;

    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id) && /^[0-9a-fA-F]{24}$/.test(req.params.id);

    if (isObjectId) {
      updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    } else {
      updatedClient = await Client.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    }

    if (!updatedClient) return res.status(404).json({ success: false, error: 'Client not found' });

    // Broadcast
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
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }

    res.json({ success: true, data: updatedClient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    let deletedClient;

    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id) && /^[0-9a-fA-F]{24}$/.test(req.params.id);

    if (isObjectId) {
      deletedClient = await Client.findByIdAndDelete(req.params.id);
    } else {
      deletedClient = await Client.findOneAndDelete({ id: req.params.id });
    }

    if (!deletedClient) return res.status(404).json({ success: false, error: 'Client not found' });

    // Broadcast
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
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }

    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;