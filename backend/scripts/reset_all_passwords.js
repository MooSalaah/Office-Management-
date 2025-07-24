// سكريبت لإعادة تعيين كلمة مرور جميع المستخدمين إلى 123456 (مع التشفير مرة واحدة فقط)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function resetAllPasswords() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const users = await User.find();
  const newPassword = '123456';
  const hashed = await bcrypt.hash(newPassword, 10);

  for (const user of users) {
    user.password = hashed;
    await user.save();
    console.log(`تم إعادة تعيين كلمة مرور المستخدم: ${user.email}`);
  }
  await mongoose.disconnect();
  console.log('تم الانتهاء من إعادة تعيين كلمات المرور لجميع المستخدمين. كلمة المرور الجديدة: 123456');
}

resetAllPasswords().catch(err => {
  console.error('حدث خطأ أثناء إعادة التعيين:', err);
  process.exit(1);
}); 