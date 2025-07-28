const mongoose = require('mongoose');

const UpcomingPaymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  client: { type: String, required: true },
  clientId: { type: String },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  dueDate: { type: String, required: true },
  status: { type: String, enum: ['pending', 'overdue', 'completed'], default: 'pending' },
  payerName: { type: String },
  description: { type: String },
  projectId: { type: String },
  projectName: { type: String },
  category: { type: String },
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'pos', 'check', 'credit'], default: 'cash' },
  importance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdBy: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  completedAt: { type: String },
  completedBy: { type: String },
  notes: { type: String }
});

// إضافة middleware للتحديث التلقائي لـ updatedAt
UpcomingPaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

module.exports = mongoose.model('UpcomingPayment', UpcomingPaymentSchema); 