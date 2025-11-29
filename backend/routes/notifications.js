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

// Update notification - search by id field instead of _id
router.put('/:id', async (req, res) => {
  try {
    const updatedNotification = await Notification.findOneAndUpdate(
      { id: req.params.id }, // البحث بالـ id بدلاً من _id
      req.body,
      { new: true }
    );
    if (!updatedNotification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, data: updatedNotification });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete all notifications for a user
router.delete('/clear', async (req, res) => {
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

module.exports = router;