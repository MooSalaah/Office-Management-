const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  id: { type: String },
  userId: { type: String, required: true, index: true }, // إضافة index للبحث السريع
  title: { type: String, required: true },
});

// إضافة middleware للتحديث التلقائي لـ updatedAt عند update
NotificationSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date().toISOString() });
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema); 