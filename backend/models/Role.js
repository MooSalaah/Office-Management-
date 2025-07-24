const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  description: { type: String },
  permissions: [{ type: String }],
  createdAt: { type: String },
  updatedAt: { type: String },
});

module.exports = mongoose.model('Role', RoleSchema); 