const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, default: 'نشط' },
  createdAt: { type: Date, default: Date.now },
  notes: { type: String },
});

module.exports = mongoose.model('Client', ClientSchema); 