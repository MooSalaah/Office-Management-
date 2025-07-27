const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  id: { type: String },
  userId: { type: String, required: true, index: true }, // إضافة index للبحث السريع
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['task', 'project', 'finance', 'system', 'attendance', 'client'], required: true },
  isRead: { type: Boolean, default: false, index: true }, // إضافة index للبحث السريع
  actionUrl: { type: String },
  triggeredBy: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

// إضافة middleware للتحديث التلقائي لـ updatedAt
NotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// إضافة middleware للتحديث التلقائي لـ updatedAt عند update
NotificationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date().toISOString() });
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema); 