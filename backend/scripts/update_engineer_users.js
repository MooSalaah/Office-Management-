const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function updateEngineerUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 تم الاتصال بقاعدة البيانات');

    // تحديث بيانات المهندسين
    const engineerUpdates = [
      {
        oldEmail: 'ar@nc',
        newData: {
          name: 'عمرو رمضان',
          email: 'ar@nc.com',
          password: 'ar@nc.com',
          role: 'engineer'
        }
      },
      {
        oldEmail: 'mm@nc',
        newData: {
          name: 'محمد مجدي',
          email: 'mm@nc.com',
          password: 'mm@nc.com',
          role: 'engineer'
        }
      }
    ];

    for (const update of engineerUpdates) {
      // البحث عن المستخدم بالبريد القديم
      const existingUser = await User.findOne({ email: update.oldEmail });
      
      if (existingUser) {
        console.log(`🔄 تحديث المستخدم: ${update.oldEmail} -> ${update.newData.email}`);
        
        // تشفير كلمة المرور الجديدة
        const hashedPassword = await bcrypt.hash(update.newData.password, 10);
        
        // تحديث البيانات
        existingUser.name = update.newData.name;
        existingUser.email = update.newData.email;
        existingUser.password = hashedPassword;
        existingUser.role = update.newData.role;
        
        await existingUser.save();
        console.log(`✅ تم تحديث المستخدم: ${update.newData.name} - ${update.newData.email}`);
      } else {
        console.log(`❌ لم يتم العثور على المستخدم: ${update.oldEmail}`);
      }
    }

    // إضافة المهندس الجديد
    const newEngineer = {
      name: 'كرم عبدالرحمن',
      email: 'ka@nc.com',
      password: 'ka@nc.com',
      role: 'engineer'
    };

    const existingNewEngineer = await User.findOne({ email: newEngineer.email });
    if (!existingNewEngineer) {
      console.log(`➕ إضافة المهندس الجديد: ${newEngineer.name}`);
      
      const hashedPassword = await bcrypt.hash(newEngineer.password, 10);
      
      const user = new User({
        ...newEngineer,
        password: hashedPassword
      });

      await user.save();
      console.log(`✅ تم إضافة المهندس: ${newEngineer.name} - ${newEngineer.email}`);
    } else {
      console.log(`ℹ️ المهندس موجود بالفعل: ${newEngineer.email}`);
    }

    // عرض جميع المستخدمين المحدثة
    console.log('\n📋 قائمة جميع المستخدمين:');
    const allUsers = await User.find({});
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n✅ تم تحديث جميع بيانات المهندسين بنجاح!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ خطأ في تحديث بيانات المهندسين:', error);
    await mongoose.disconnect();
  }
}

updateEngineerUsers(); 