const express = require('express');
const router = express.Router();
const UserSettings = require('../models/UserSettings');

// Get user settings by userId
router.get('/:userId', async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.params.userId });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create or update user settings
router.post('/', async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.body.userId });
    if (settings) {
      Object.assign(settings, req.body);
      await settings.save();
    } else {
      settings = new UserSettings(req.body);
      await settings.save();
    }
    res.status(201).json({ success: true, data: settings });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router; 