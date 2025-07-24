const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  status: { type: String, default: 'active' },
  notes: { type: String },
  projectsCount: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  lastContact: { type: String },
  avatar: { type: String },
  createdAt: { type: String },
});

module.exports = mongoose.model('Client', ClientSchema); 