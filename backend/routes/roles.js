const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const logger = require('../logger');

// Get all roles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Seed default roles (create if they don't exist)
router.post('/seed', async (req, res) => {
  try {
    const defaultRoles = [
      {
        id: '1',
        name: 'admin',
        description: 'مدير النظام - صلاحيات كاملة',
        permissions: ['all'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'engineer',
        description: 'مهندس - إدارة المشاريع والمهام',
        permissions: ['projects', 'tasks', 'clients', 'view_finance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'accountant',
        description: 'محاسب - إدارة المالية والمعاملات',
        permissions: ['finance', 'transactions', 'reports'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'hr',
        description: 'موارد بشرية - إدارة الحضور والموظفين',
        permissions: ['attendance', 'users', 'reports'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'user',
        description: 'مستخدم عادي - صلاحيات محدودة',
        permissions: ['view_projects', 'view_tasks'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const createdRoles = [];
    
    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = new Role(roleData);
        const savedRole = await role.save();
        createdRoles.push(savedRole);
        logger.info(`Created role: ${roleData.name}`, { roleId: savedRole._id }, 'ROLES');
      } else {
        createdRoles.push(existingRole);
        logger.info(`Role already exists: ${roleData.name}`, { roleId: existingRole._id }, 'ROLES');
      }
    }

    res.json({ 
      success: true, 
      message: `تم إنشاء/تحديث ${createdRoles.length} دور`,
      data: createdRoles 
    });
  } catch (err) {
    logger.error('Error seeding roles', { error: err.message }, 'ROLES');
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