const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('../models/Task');
const User = require('../models/User');

async function fixTaskAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 تم الاتصال بقاعدة البيانات');

    // جلب جميع المستخدمين
    const users = await User.find({});
    console.log(`👥 تم جلب ${users.length} مستخدم`);

    // إنشاء خريطة للمعرفات القديمة
    const oldToNewMapping = {
      'u1001': users.find(u => u.email === 'mm@nc.com')?._id, // محمد مجدي
      'u1002': users.find(u => u.email === 'ar@nc.com')?._id, // عمرو رمضان
      'u1003': users.find(u => u.email === 'ka@nc.com')?._id, // كرم عبدالرحمن
      '1': users.find(u => u.email === 'ms@nc.com')?._id,     // مصطفى صلاح
      '2': users.find(u => u.email === 'mk@nc.com')?._id,     // محمد قطب
    };

    console.log('\n🗺️ خريطة المعرفات:');
    Object.entries(oldToNewMapping).forEach(([oldId, newId]) => {
      const user = users.find(u => u._id.equals(newId));
      console.log(`   ${oldId} -> ${user?.name} (${user?.email})`);
    });

    // جلب جميع المهام
    const tasks = await Task.find({});
    console.log(`\n📋 تم جلب ${tasks.length} مهمة`);

    let updatedCount = 0;

    for (const task of tasks) {
      const oldAssigneeId = task.assigneeId;
      
      if (oldAssigneeId && oldToNewMapping[oldAssigneeId]) {
        const newAssigneeId = oldToNewMapping[oldAssigneeId];
        const user = users.find(u => u._id.equals(newAssigneeId));
        
        console.log(`\n🔄 تحديث المهمة: "${task.title}"`);
        console.log(`   من: ${oldAssigneeId}`);
        console.log(`   إلى: ${user?.name} (${user?.email})`);
        
        task.assigneeId = newAssigneeId;
        await task.save();
        updatedCount++;
        
        console.log(`   ✅ تم التحديث`);
      } else if (oldAssigneeId) {
        console.log(`\n⚠️ معرف غير معروف: ${oldAssigneeId} للمهمة "${task.title}"`);
      }
    }

    console.log(`\n📊 ملخص التحديثات:`);
    console.log(`   - إجمالي المهام: ${tasks.length}`);
    console.log(`   - المهام المحدثة: ${updatedCount}`);
    console.log(`   - المهام غير المحدثة: ${tasks.length - updatedCount}`);

    // عرض المهام بعد التحديث
    console.log('\n📝 المهام بعد التحديث:');
    const updatedTasks = await Task.find({}).populate('assigneeId');
    updatedTasks.forEach((task, index) => {
      const assignee = task.assigneeId;
      console.log(`\n${index + 1}. ${task.title}`);
      console.log(`   - المسؤول: ${assignee?.name || 'غير محدد'} (${assignee?.email || 'غير محدد'})`);
      console.log(`   - الحالة: ${task.status}`);
      console.log(`   - المشروع: ${task.projectId}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ تم إصلاح ربط المهام بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في إصلاح ربط المهام:', error);
    await mongoose.disconnect();
  }
}

fixTaskAssignments(); 