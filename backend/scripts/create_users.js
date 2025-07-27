const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const users = [
      {
        name: 'مصطفى صلاح',
        email: 'ms@nc',
        password: 'ms123',
        role: 'admin'
      },
      {
        name: 'محمد قطب',
        email: 'mk@nc',
        password: 'mk123',
        role: 'admin'
      },
      {
        name: 'عمرو رمضان',
        email: 'ar@nc',
        password: 'ar123',
        role: 'engineer'
      },
      {
        name: 'محمد مجدي',
        email: 'mm@nc',
        password: 'mm123',
        role: 'engineer'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`المستخدم موجود بالفعل: ${userData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`تم إنشاء المستخدم: ${userData.name} - ${userData.email}`);
    }

    console.log('تم إنشاء جميع المستخدمين بنجاح!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('خطأ في إنشاء المستخدمين:', error);
    await mongoose.disconnect();
  }
}

createUsers(); 