const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const records = await Attendance.find();
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new attendance record
router.post('/', async (req, res) => {
  try {
    const record = new Attendance(req.body);
    const newRecord = await record.save();
    res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update attendance record
router.put('/:id', async (req, res) => {
  try {
    const updatedRecord = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedRecord) return res.status(404).json({ success: false, error: 'Attendance record not found' });
    res.json({ success: true, data: updatedRecord });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    const deletedRecord = await Attendance.findByIdAndDelete(req.params.id);
    if (!deletedRecord) return res.status(404).json({ success: false, error: 'Attendance record not found' });
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 