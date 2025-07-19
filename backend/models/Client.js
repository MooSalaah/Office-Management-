const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  company: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Client', ClientSchema); 