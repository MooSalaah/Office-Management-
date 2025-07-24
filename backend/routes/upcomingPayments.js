const express = require('express');
const router = express.Router();
const UpcomingPayment = require('../models/UpcomingPayment');

// Get all upcoming payments
router.get('/', async (req, res) => {
  try {
    const payments = await UpcomingPayment.find();
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new upcoming payment
router.post('/', async (req, res) => {
  try {
    const payment = new UpcomingPayment(req.body);
    const newPayment = await payment.save();
    res.status(201).json({ success: true, data: newPayment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update upcoming payment
router.put('/:id', async (req, res) => {
  try {
    const updatedPayment = await UpcomingPayment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPayment) return res.status(404).json({ success: false, error: 'Upcoming payment not found' });
    res.json({ success: true, data: updatedPayment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete upcoming payment
router.delete('/:id', async (req, res) => {
  try {
    const deletedPayment = await UpcomingPayment.findByIdAndDelete(req.params.id);
    if (!deletedPayment) return res.status(404).json({ success: false, error: 'Upcoming payment not found' });
    res.json({ success: true, message: 'Upcoming payment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 