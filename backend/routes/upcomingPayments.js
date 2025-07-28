const express = require('express');
const router = express.Router();
const UpcomingPayment = require('../models/UpcomingPayment');
const Transaction = require('../models/Transaction');

// Get all upcoming payments
router.get('/', async (req, res) => {
  try {
    const payments = await UpcomingPayment.find().sort({ dueDate: 1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new upcoming payment
router.post('/', async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      id: req.body.id || `upcoming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const payment = new UpcomingPayment(paymentData);
    const newPayment = await payment.save();
    res.status(201).json({ success: true, data: newPayment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update upcoming payment
router.put('/:id', async (req, res) => {
  try {
    const updatedPayment = await UpcomingPayment.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (!updatedPayment) return res.status(404).json({ success: false, error: 'Upcoming payment not found' });
    res.json({ success: true, data: updatedPayment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Complete upcoming payment and create transaction
router.post('/:id/complete', async (req, res) => {
  try {
    const payment = await UpcomingPayment.findOne({ id: req.params.id });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Upcoming payment not found' });
    }

    // إنشاء معاملة مالية من الدفعة القادمة
    const transactionData = {
      id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: payment.type,
      amount: payment.amount,
      description: `دفعة مكتملة - ${payment.description || payment.client}`,
      date: new Date().toISOString().split('T')[0],
      category: payment.category || 'payment_completion',
      transactionType: 'payment_completion',
      status: 'completed',
      importance: payment.importance || 'medium',
      paymentMethod: payment.paymentMethod || 'cash',
      projectId: payment.projectId,
      clientId: payment.clientId,
      clientName: payment.client,
      projectName: payment.projectName,
      createdBy: req.body.completedBy || payment.createdBy,
      createdAt: new Date().toISOString(),
      remainingAmount: 0,
      payerName: payment.payerName || payment.client,
    };

    // حفظ المعاملة المالية
    const transaction = new Transaction(transactionData);
    const savedTransaction = await transaction.save();

    // تحديث حالة الدفعة القادمة إلى مكتملة
    payment.status = 'completed';
    payment.completedAt = new Date().toISOString();
    payment.completedBy = req.body.completedBy || payment.createdBy;
    payment.updatedAt = new Date().toISOString();
    await payment.save();

    res.json({ 
      success: true, 
      data: {
        payment: payment,
        transaction: savedTransaction
      },
      message: 'تم إكمال الدفعة وإنشاء المعاملة المالية بنجاح'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete upcoming payment
router.delete('/:id', async (req, res) => {
  try {
    const deletedPayment = await UpcomingPayment.findOneAndDelete({ id: req.params.id });
    if (!deletedPayment) return res.status(404).json({ success: false, error: 'Upcoming payment not found' });
    res.json({ success: true, message: 'Upcoming payment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get overdue payments
router.get('/overdue', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const overduePayments = await UpcomingPayment.find({
      dueDate: { $lt: today },
      status: { $ne: 'completed' }
    }).sort({ dueDate: 1 });
    
    res.json({ success: true, data: overduePayments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get payments due today
router.get('/due-today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dueTodayPayments = await UpcomingPayment.find({
      dueDate: today,
      status: { $ne: 'completed' }
    }).sort({ importance: -1 });
    
    res.json({ success: true, data: dueTodayPayments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 