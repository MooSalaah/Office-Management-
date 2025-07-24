const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  id: { type: String },
  userId: { type: String, required: true },
  userName: { type: String },
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
  overtimePay: { type: Number },
});

module.exports = mongoose.model('Attendance', AttendanceSchema); 