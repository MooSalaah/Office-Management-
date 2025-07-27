const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('../models/Task');
const User = require('../models/User');

async function checkTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 تم الاتصال بقاعدة البيانات');

    // جلب جميع المهام
    const tasks = await Task.find({});
    console.log(`\n📋 إجمالي المهام في قاعدة البيانات: ${tasks.length}`);

    if (tasks.length === 0) {
      console.log('❌ لا توجد مهام في قاعدة البيانات!');
      return;
    }

    // عرض تفاصيل كل مهمة
    console.log('\n📝 تفاصيل المهام:');
    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.title}`);
      console.log(`   - الوصف: ${task.description}`);
      console.log(`   - الحالة: ${task.status}`);
      console.log(`   - الأولوية: ${task.priority}`);
      console.log(`   - المسؤول: ${task.assigneeId}`);
      console.log(`   - المشروع: ${task.projectId}`);
      console.log(`   - تاريخ الإنشاء: ${task.createdAt}`);
    });

    // جلب جميع المستخدمين
    const users = await User.find({});
    console.log(`\n👥 إجمالي المستخدمين: ${users.length}`);

    console.log('\n👤 تفاصيل المستخدمين:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   - البريد الإلكتروني: ${user.email}`);
      console.log(`   - الدور: ${user.role}`);
      console.log(`   - المعرف: ${user._id}`);
    });

    // فحص المهام المخصصة لكل مهندس
    console.log('\n🔍 فحص المهام المخصصة للمهندسين:');
    
    const engineers = users.filter(user => user.role === 'engineer');
    engineers.forEach(engineer => {
      const engineerTasks = tasks.filter(task => task.assigneeId === engineer._id.toString());
      console.log(`\n👷 ${engineer.name} (${engineer.email}):`);
      console.log(`   - المعرف: ${engineer._id}`);
      console.log(`   - عدد المهام المخصصة: ${engineerTasks.length}`);
      
      if (engineerTasks.length > 0) {
        engineerTasks.forEach(task => {
          console.log(`     • ${task.title} (${task.status})`);
        });
      } else {
        console.log(`     • لا توجد مهام مخصصة`);
      }
    });

    // فحص المهام غير المخصصة
    const unassignedTasks = tasks.filter(task => !task.assigneeId);
    console.log(`\n❓ المهام غير المخصصة: ${unassignedTasks.length}`);
    if (unassignedTasks.length > 0) {
      unassignedTasks.forEach(task => {
        console.log(`   • ${task.title} (${task.status})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ تم فحص قاعدة البيانات بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في فحص قاعدة البيانات:', error);
    await mongoose.disconnect();
  }
}

checkTasks(); 