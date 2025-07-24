const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    const newTransaction = await transaction.save();
    res.status(201).json({ success: true, data: newTransaction });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTransaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: updatedTransaction });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 