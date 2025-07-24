const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new notification
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const newNotification = await notification.save();
    res.status(201).json({ success: true, data: newNotification });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update notification
router.put('/:id', async (req, res) => {
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedNotification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, data: updatedNotification });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const deletedNotification = await Notification.findByIdAndDelete(req.params.id);
    if (!deletedNotification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 