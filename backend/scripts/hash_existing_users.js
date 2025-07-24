// سكريبت لتحديث كلمات مرور المستخدمين وتشفيرها إذا لم تكن مشفرة
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function hashPasswords() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const users = await User.find();
  for (const user of users) {
    // إذا كانت كلمة المرور ليست مشفرة (طولها أقل من 30 أو لا تبدأ بـ $2)
    if (!user.password.startsWith('$2') || user.password.length < 30) {
      const hashed = await bcrypt.hash(user.password, 10);
      user.password = hashed;
      await user.save();
      console.log(`تم تشفير كلمة مرور المستخدم: ${user.email}`);
    } else {
      console.log(`كلمة مرور المستخدم مشفرة بالفعل: ${user.email}`);
    }
  }
  await mongoose.disconnect();
  console.log('تم الانتهاء من تشفير جميع كلمات المرور.');
}

hashPasswords().catch(err => {
  console.error('حدث خطأ أثناء التشفير:', err);
  process.exit(1);
}); 