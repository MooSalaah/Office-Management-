const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, default: 'قيد التنفيذ' },
  notes: { type: String },
});

module.exports = mongoose.model('Project', ProjectSchema); 