const express = require('express');
const router = express.Router();
const CompanySettings = require('../models/CompanySettings');

// Get company settings (assume one document)
router.get('/', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create or update company settings
router.post('/', async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (settings) {
      Object.assign(settings, req.body);
      await settings.save();
    } else {
      settings = new CompanySettings(req.body);
      await settings.save();
    }
    res.status(201).json({ success: true, data: settings });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router; 