const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
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

// Get all tasks (public for testing)
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get task by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new task (public for testing)
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    const newTask = await task.save();
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'create',
          data: newTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update task (public for testing)
router.put('/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTask) return res.status(404).json({ success: false, error: 'Task not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'update',
          data: updatedTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.json({ success: true, data: updatedTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete task (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ success: false, error: 'Task not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'delete',
          data: deletedTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 