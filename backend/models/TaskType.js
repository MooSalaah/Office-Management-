const mongoose = require('mongoose');

const TaskTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

module.exports = mongoose.model('TaskType', TaskTypeSchema); 