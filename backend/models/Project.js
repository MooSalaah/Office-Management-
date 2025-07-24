const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  client: { type: String, required: true },
  clientId: { type: String },
  type: { type: String },
  status: { type: String, default: 'in-progress' },
  team: [{ type: String }],
  startDate: { type: String },
  startDateHijri: { type: String },
  price: { type: Number, default: 0 },
  downPayment: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
  assignedEngineerId: { type: String },
  assignedEngineerName: { type: String },
  importance: { type: String, default: 'medium' },
  description: { type: String },
  progress: { type: Number, default: 0 },
  createdBy: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },
  endDate: { type: String },
  notes: { type: String },
});

module.exports = mongoose.model('Project', ProjectSchema); 