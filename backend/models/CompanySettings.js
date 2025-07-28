const mongoose = require('mongoose');

const CompanySettingsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, default: "" },
  stamp: { type: String, default: "" }, // ✅ إضافة حقل ختم الشركة
  signature: { type: String, default: "" }, // ✅ إضافة حقل توقيع المكتب
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  website: { type: String, default: "" },
  description: { type: String, default: "" },
});

module.exports = mongoose.model('CompanySettings', CompanySettingsSchema); 