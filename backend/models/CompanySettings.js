const mongoose = require('mongoose');

const CompanySettingsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  website: { type: String },
  description: { type: String },
});

module.exports = mongoose.model('CompanySettings', CompanySettingsSchema); 