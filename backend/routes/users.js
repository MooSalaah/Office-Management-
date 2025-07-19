const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users (public for testing)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching users:', err);
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
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new user (public for testing)
router.post('/', async (req, res) => {
  try {
    const { name, email, role, department, phone } = req.body;
    const user = new User({ name, email, role, department, phone });
    const newUser = await user.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(400).json({ success: false, error: err.message });
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
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete user (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 