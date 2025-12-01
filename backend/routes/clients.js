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
  if (mongoose.Types.ObjectId.isValid(id)) {
    return await Client.findById(id);
  } else {
    return await Client.findOne({ id: id });
  }
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
    const client = await findClient(req.params.id);
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

    // Create notification for new client (notify admin and sales team)
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');

      // Get admin and sales users
      const adminUsers = await User.find({ role: 'admin' });
      const salesUsers = await User.find({ role: 'engineer' }); // Engineers might handle client relations

      const usersToNotify = [...adminUsers, ...salesUsers];

      for (const user of usersToNotify) {
        const notification = new Notification({
          userId: user.id,
          title: "عميل جديد",
          message: `تم إضافة عميل جديد: "${newClient.name}"`,
          type: "system",
          isRead: false,
          actionUrl: `/clients`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await notification.save();
      }

      logger.info('Notifications created for new client', {
        clientId: newClient.id,
        notificationsCount: usersToNotify.length
      }, 'CLIENTS');
    } catch (notificationError) {
      logger.error('Failed to create notifications for new client', {
        error: notificationError.message,
        clientId: newClient.id
      }, 'CLIENTS');
    }

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
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'CLIENTS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }
    res.status(201).json({ success: true, data: newClient });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update client (public for testing)
router.put('/:id', async (req, res) => {
  try {
    const originalClient = await findClient(req.params.id);
    if (!originalClient) return res.status(404).json({ success: false, error: 'Client not found' });

    let updatedClient;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    } else {
      updatedClient = await Client.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    }

    // Send notifications for client updates
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');

      // Get user who updated the client
      const updatedBy = req.body.updatedBy || req.user?.id || 'system';
      const updatedByName = req.body.updatedByName || req.user?.name || 'مستخدم';

      // Notify admin users about client updates
      const adminUsers = await User.find({ role: 'admin' });

      for (const admin of adminUsers) {
        if (admin._id.toString() !== updatedBy) {
          const notification = new Notification({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: admin._id.toString(),
            title: "تحديث بيانات عميل",
            message: `تم تحديث بيانات العميل "${updatedClient.name}" بواسطة ${updatedByName}`,
            type: "client",
            isRead: false,
            actionUrl: `/clients`,
            triggeredBy: updatedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          await notification.save();
        }
      }

      logger.info('Notifications sent for client update', {
        clientId: updatedClient.id,
        clientName: updatedClient.name,
        updatedBy: updatedByName
      }, 'CLIENTS');
    } catch (notificationError) {
      logger.error('Failed to send client update notifications', {
        error: notificationError.message,
        clientId: updatedClient.id
      }, 'CLIENTS');
    }

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
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'CLIENTS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }
    res.json({ success: true, data: updatedClient });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete client (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    let deletedClient;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      deletedClient = await Client.findByIdAndDelete(req.params.id);
    } else {
      deletedClient = await Client.findOneAndDelete({ id: req.params.id });
    }

    if (!deletedClient) return res.status(404).json({ success: false, error: 'Client not found' });

    // Send notifications for client deletion
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');

      // Get user who deleted the client
      const deletedBy = req.body.deletedBy || req.user?.id || 'system';
      const deletedByName = req.body.deletedByName || req.user?.name || 'مستخدم';

      // Notify admin users about client deletion
      const adminUsers = await User.find({ role: 'admin' });

      for (const admin of adminUsers) {
        if (admin._id.toString() !== deletedBy) {
          const notification = new Notification({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: admin._id.toString(),
            title: "تم حذف عميل",
            message: `تم حذف العميل "${deletedClient.name}" بواسطة ${deletedByName}`,
            type: "client",
            isRead: false,
            actionUrl: `/clients`,
            triggeredBy: deletedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          await notification.save();
        }
      }

      logger.info('Notifications sent for client deletion', {
        clientId: deletedClient.id,
        clientName: deletedClient.name,
        deletedBy: deletedByName
      }, 'CLIENTS');
    } catch (notificationError) {
      logger.error('Failed to send client deletion notifications', {
        error: notificationError.message,
        clientId: deletedClient.id
      }, 'CLIENTS');
    }

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
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'CLIENTS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;