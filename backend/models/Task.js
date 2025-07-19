const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: String },
  assignedTo: { type: String },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', TaskSchema); 