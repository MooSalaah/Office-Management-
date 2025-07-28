const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  permissions: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Role', RoleSchema); 