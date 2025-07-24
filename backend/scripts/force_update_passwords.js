// سكريبت لتحديث كلمات مرور جميع المستخدمين مباشرة في قاعدة البيانات (تشفير يدوي)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function forceUpdatePasswords() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const users = await User.find();
  const newPassword = '123456';
  const hashed = await bcrypt.hash(newPassword, 10);

  for (const user of users) {
    await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
    console.log(`تم تحديث كلمة مرور المستخدم: ${user.email}`);
  }
  await mongoose.disconnect();
  console.log('تم الانتهاء من تحديث كلمات المرور لجميع المستخدمين مباشرة. كلمة المرور الجديدة: 123456');
}

forceUpdatePasswords().catch(err => {
  console.error('حدث خطأ أثناء التحديث:', err);
  process.exit(1);
}); 