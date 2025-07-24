const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  emailNotifications: { type: Boolean, default: true },
  taskNotifications: { type: Boolean, default: true },
  projectNotifications: { type: Boolean, default: true },
  financeNotifications: { type: Boolean, default: true },
  systemNotifications: { type: Boolean, default: true },
  darkMode: { type: Boolean, default: false },
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    taskNotifications: { type: Boolean, default: true },
    projectNotifications: { type: Boolean, default: true },
    financeNotifications: { type: Boolean, default: true },
    systemNotifications: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model('UserSettings', UserSettingsSchema); 