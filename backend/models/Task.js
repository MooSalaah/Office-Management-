const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  assigneeId: { type: String },
  assigneeName: { type: String },
  projectId: { type: String },
  projectName: { type: String },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'todo' },
  dueDate: { type: String },
  createdBy: { type: String },
  createdByName: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },
});

module.exports = mongoose.model('Task', TaskSchema); 