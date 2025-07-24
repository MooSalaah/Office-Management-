const express = require('express');
const router = express.Router();
const Role = require('../models/Role');

// Get all roles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new role
router.post('/', async (req, res) => {
  try {
    const role = new Role(req.body);
    const newRole = await role.save();
    res.status(201).json({ success: true, data: newRole });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update role
router.put('/:id', async (req, res) => {
  try {
    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedRole) return res.status(404).json({ success: false, error: 'Role not found' });
    res.json({ success: true, data: updatedRole });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete role
router.delete('/:id', async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);
    if (!deletedRole) return res.status(404).json({ success: false, error: 'Role not found' });
    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 