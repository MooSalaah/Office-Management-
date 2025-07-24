// سكريبت لإزالة التشفير من كلمات مرور جميع المستخدمين (تعيين كلمة مرور نصية عادية)
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function removeHashPasswords() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const users = await User.find();
  const newPassword = '123456';

  for (const user of users) {
    await User.updateOne({ _id: user._id }, { $set: { password: newPassword } });
    console.log(`تم تعيين كلمة مرور نصية للمستخدم: ${user.email}`);
  }
  await mongoose.disconnect();
  console.log('تم الانتهاء من تعيين كلمات مرور نصية لجميع المستخدمين. كلمة المرور الجديدة: 123456');
}

removeHashPasswords().catch(err => {
  console.error('حدث خطأ أثناء التحديث:', err);
  process.exit(1);
}); 