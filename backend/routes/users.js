```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const bcrypt = require('bcryptjs');
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

// Get all users (public for testing, but hide passwords)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user by ID (public for testing, but hide passwords)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const userData = req.body;
    
    // Hash password
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = new User(userData);
    const newUser = await user.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${ req.protocol }://${req.get('host')}/api/realtime/broadcast`, {
method: 'POST',
  headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
  type: 'user',
  action: 'create',
  data: userResponse,
  userId: req.user ? req.user.id : 'system',
  timestamp: Date.now()
})
      });
logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'USERS');
    } catch (broadcastError) {
  logger.error('Broadcast error', { error: broadcastError.message }, 'USERS');
}
res.status(201).json({ success: true, data: userResponse });
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

    // Check password (support both hashed and legacy plaintext)
    let isMatch = false;

    // 1. Try bcrypt compare
    isMatch = await bcrypt.compare(password, user.password);

    // 2. If fail, check if it's a legacy plaintext password
    if (!isMatch && password === user.password) {
      isMatch = true;
      // Migrate to hashed password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      console.log(`Migrated user ${user.email} to hashed password`);
    }

    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };

    // Handle password update
    if (updates.password) {
      // If password is provided and not empty
      if (updates.password.trim().length > 0) {
        // Check if it's already hashed (simple check, not perfect but helps avoid double hashing if frontend sends hash)
        // Note: Frontend should ideally send 'newPassword' field, but here we handle 'password'
        // Assuming frontend sends plaintext password for update
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
      } else {
        // If empty, don't update password
        delete updates.password;
      }
    } else {
      delete updates.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

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
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'USERS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'USERS');
    }
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete user (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id).select('-password');
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
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'USERS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'USERS');
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```