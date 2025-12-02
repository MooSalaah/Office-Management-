const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
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

// Update notification - search by id or _id
router.put('/:id', async (req, res) => {
  try {
    const updatedNotification = await Notification.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { _id: req.params.id }] },
      req.body,
      { new: true }
    );
    if (!updatedNotification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, data: updatedNotification });
  } catch (err) {
    // Try finding by _id if the first attempt failed (in case of cast error for _id)
    try {
      const updatedNotification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedNotification) return res.status(404).json({ success: false, error: 'Notification not found' });
      res.json({ success: true, data: updatedNotification });
    } catch (retryErr) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
});

// Delete all notifications for a user
router.post('/clear', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    await Notification.deleteMany({ userId });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete single notification
router.delete('/:id', async (req, res) => {
  try {
    const deletedNotification = await Notification.findOneAndDelete({
      $or: [{ id: req.params.id }, { _id: req.params.id }]
    });

    if (!deletedNotification) {
      // Try finding by _id directly
      try {
        const deletedById = await Notification.findByIdAndDelete(req.params.id);
        if (!deletedById) return res.status(404).json({ success: false, error: 'Notification not found' });
        return res.json({ success: true, message: 'Notification deleted' });
      } catch (e) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    // Try finding by _id directly as fallback
    try {
      const deletedById = await Notification.findByIdAndDelete(req.params.id);
      if (!deletedById) return res.status(404).json({ success: false, error: 'Notification not found' });
      return res.json({ success: true, message: 'Notification deleted' });
    } catch (e) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

module.exports = router;