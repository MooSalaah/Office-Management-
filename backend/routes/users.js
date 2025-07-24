const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
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

// Get all users (public for testing)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new user (public for testing)
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    const newUser = await user.save();
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          action: 'create',
          data: newUser,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// User login (returns JWT)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
    // Generate JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (public for testing)
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ success: false, error: 'User not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          action: 'update',
          data: updatedUser,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete user (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ success: false, error: 'User not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          action: 'delete',
          data: deletedUser,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 