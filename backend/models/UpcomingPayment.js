const mongoose = require('mongoose');

const UpcomingPaymentSchema = new mongoose.Schema({
  id: { type: String },
  client: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  dueDate: { type: String, required: true },
  status: { type: String, enum: ['pending', 'overdue'], default: 'pending' },
  payerName: { type: String },
});

module.exports = mongoose.model('UpcomingPayment', UpcomingPaymentSchema); 