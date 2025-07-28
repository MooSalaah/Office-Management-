const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  checkIn: { type: String },
  checkOut: { type: String },
  session: { type: String, enum: ['morning', 'evening'], required: true },
  regularHours: { type: Number, default: 0 },
  lateHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },
  date: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'overtime'], default: 'present' },
  notes: { type: String },
  overtimePay: { type: Number, default: 0 },
  location: { type: String },
  device: { type: String },
  ipAddress: { type: String },
  createdBy: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  isManualEntry: { type: Boolean, default: false },
  manualEntryBy: { type: String },
  approvedBy: { type: String },
  approvedAt: { type: String },
  rejectionReason: { type: String }
});

// إضافة middleware للتحديث التلقائي لـ updatedAt
AttendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// إضافة index للبحث السريع
AttendanceSchema.index({ userId: 1, date: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema); 