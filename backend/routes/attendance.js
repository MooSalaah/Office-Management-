const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get attendance records by user
router.get('/user/:userId', async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get attendance records by date
router.get('/date/:date', async (req, res) => {
  try {
    const records = await Attendance.find({ date: req.params.date }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get today's attendance records
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await Attendance.find({ date: today }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get monthly attendance records
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const records = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1, createdAt: -1 });

    const updatedRecord = await Attendance.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (!updatedRecord) {
      // إذا لم يجد بالـ id المخصص، جرب البحث بالـ _id
      const updatedByMongoId = await Attendance.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (!updatedByMongoId) {
        return res.status(404).json({ success: false, error: 'Attendance record not found' });
      }
      return res.json({ success: true, data: updatedByMongoId });
    }
    res.json({ success: true, data: updatedRecord });
  } catch (err) {
    console.error('Error updating attendance record:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    // البحث بالـ id المخصص بدلاً من _id
    const deletedRecord = await Attendance.findOneAndDelete({ id: req.params.id });
    if (!deletedRecord) {
      // إذا لم يجد بالـ id المخصص، جرب البحث بالـ _id
      const deletedByMongoId = await Attendance.findByIdAndDelete(req.params.id);
      if (!deletedByMongoId) {
        return res.status(404).json({ success: false, error: 'Attendance record not found' });
      }
      return res.json({ success: true, message: 'Attendance record deleted', data: deletedByMongoId });
    }
    res.json({ success: true, message: 'Attendance record deleted', data: deletedRecord });
  } catch (err) {
    console.error('Error deleting attendance record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk delete attendance records
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: 'IDs array is required' });
    }

    // البحث بالـ id المخصص بدلاً من _id
    const result = await Attendance.deleteMany({ id: { $in: ids } });
    res.json({
      success: true,
      message: `${result.deletedCount} attendance records deleted`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error bulk deleting attendance records:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get attendance statistics
router.get('/stats/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    let query = {};
    if (userId) query.userId = userId;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query);

    const stats = {
      totalRecords: records.length,
      presentDays: records.filter(r => r.status === 'present').length,
      lateDays: records.filter(r => r.status === 'late').length,
      absentDays: records.filter(r => r.status === 'absent').length,
      overtimeDays: records.filter(r => r.status === 'overtime').length,
      totalHours: records.reduce((sum, r) => sum + (r.totalHours || 0), 0),
      totalOvertimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
      averageHoursPerDay: records.length > 0 ?
        records.reduce((sum, r) => sum + (r.totalHours || 0), 0) / records.length : 0
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 