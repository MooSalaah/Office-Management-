const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  avatar: { type: String, default: "" },
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  permissions: [{ type: String }],
  monthlySalary: { type: Number, default: 5000 },
  const mongoose = require('mongoose');

  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true },
    permissions: [{ type: String }],
    monthlySalary: { type: Number, default: 5000 },
    workingHours: {
      morningStart: { type: String, default: '08:00' },
      morningEnd: { type: String, default: '12:00' },
      eveningStart: { type: String, default: '13:00' },
      eveningEnd: { type: String, default: '17:00' }
    },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null }, // For soft delete
  });

  module.exports = mongoose.model('User', UserSchema);