const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: { type: String },
  assigneeId: { type: String },
  assigneeName: { type: String },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  projectName: { type: String },
  createdBy: { type: String },
  createdByName: { type: String },
}, { timestamps: true });

// Add id field for frontend compatibility if needed, but prefer _id
TaskSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

TaskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('Task', TaskSchema);