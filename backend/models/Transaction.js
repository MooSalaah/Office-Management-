const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  id: { type: String },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  clientId: { type: String },
  clientName: { type: String },
  projectId: { type: String },
  projectName: { type: String },
  category: { type: String },
  transactionType: { type: String },
  importance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'pos', 'check', 'credit'] },
  date: { type: String },
  status: { type: String, enum: ['completed', 'pending', 'draft', 'canceled'], default: 'pending' },
  createdBy: { type: String },
  createdAt: { type: String },
  remainingAmount: { type: Number },
  payerName: { type: String },
});

module.exports = mongoose.model('Transaction', TransactionSchema); 