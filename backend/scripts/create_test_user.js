// سكريبت لإضافة مستخدم جديد بكلمة مرور معروفة
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createTestUser() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const email = 'test@nc.com';
  const password = '123456';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('المستخدم موجود بالفعل');
    await mongoose.disconnect();
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({
    name: 'Test User',
    email,
    password: hashed,
    role: 'admin',
  });
  await user.save();
  console.log('تم إنشاء المستخدم بنجاح: test@nc.com / 123456');
  await mongoose.disconnect();
}

createTestUser().catch(err => {
  console.error('حدث خطأ أثناء إنشاء المستخدم:', err);
  process.exit(1);
}); 