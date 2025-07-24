const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  id: { type: String },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['task', 'project', 'finance', 'system', 'attendance'], required: true },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String },
  triggeredBy: { type: String },
  createdAt: { type: String },
});

module.exports = mongoose.model('Notification', NotificationSchema); 