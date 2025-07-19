const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: String, required: true },
  assignedTo: { type: String, required: true },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  dueDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', TaskSchema); 