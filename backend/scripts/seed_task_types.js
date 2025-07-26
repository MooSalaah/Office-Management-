const mongoose = require('mongoose');
const TaskType = require('../models/TaskType');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://inspectionteam97:ZR2Tyf9iQyIuwGDc@office-management.cjyz0ld.mongodb.net/?retryWrites=true&w=majority&appName=Office-Management';

const defaultTaskTypes = [
  { name: "رسم مخططات معمارية", description: "رسم المخططات المعمارية الأساسية للمشروع", isDefault: true },
  { name: "قرار مساحي", description: "إعداد القرار المساحي للمشروع", isDefault: true },
  { name: "عمل فكرة مخطط معماري", description: "تطوير الفكرة الأولية للمخطط المعماري", isDefault: true },
  { name: "مخطط سلامة", description: "إعداد مخطط السلامة للمشروع", isDefault: true },
  { name: "رفع الرخصة", description: "رفع طلب الرخصة البلدية", isDefault: true },
  { name: "مخطط انشائي", description: "إعداد المخططات الإنشائية", isDefault: true },
  { name: "منظور 3D", description: "إنشاء منظور ثلاثي الأبعاد للمشروع", isDefault: true },
  { name: "ربط الرخصة", description: "ربط الرخصة مع الجهات المختصة", isDefault: true },
  { name: "تقرير فني الكتروني", description: "إعداد تقرير فني الكتروني للمشروع", isDefault: true },
  { name: "اضافة وتعديل مكونات البناء", description: "إضافة أو تعديل مكونات البناء في المشروع", isDefault: true },
  { name: "شهادة انهاء اعمال السلامة", description: "إصدار شهادة إنهاء أعمال السلامة", isDefault: true },
  { name: "مطابقة مخططات السلامة", description: "مطابقة مخططات السلامة مع المتطلبات", isDefault: true },
  { name: "رفع تقارير الاشراف", description: "رفع تقارير الإشراف الدورية", isDefault: true },
  { name: "الاشراف على الرخصة", description: "الإشراف على الرخصة أثناء التنفيذ", isDefault: true },
  { name: "شهادة اشغال", description: "إصدار شهادة إشغال للمشروع", isDefault: true },
  { name: "فرز", description: "إجراءات فرز الوحدات أو الأراضي", isDefault: true },
  { name: "مخطط طاقة استيعابية", description: "إعداد مخطط الطاقة الاستيعابية للمشروع", isDefault: true },
  { name: "تقرير اسكان حجاج", description: "إعداد تقرير إسكان الحجاج", isDefault: true },
  { name: "تقرير سلامة فوري", description: "إعداد تقرير سلامة فوري للمشروع", isDefault: true },
  { name: "تقرير سلامة غير فوري", description: "إعداد تقرير سلامة غير فوري للمشروع", isDefault: true },
  { name: "رخصة تسوير", description: "إصدار رخصة تسوير للموقع", isDefault: true },
  { name: "رخصة بناء", description: "إصدار رخصة بناء للمشروع", isDefault: true }
];

function addTimestamps(arr) {
  const now = new Date().toISOString();
  return arr.map(t => ({ ...t, createdAt: now, updatedAt: now }));
}

async function seedTaskTypes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing default task types
    await TaskType.deleteMany({ isDefault: true });
    console.log('Cleared existing default task types');

    // Insert new default task types
    const insertedTaskTypes = await TaskType.insertMany(addTimestamps(defaultTaskTypes));
    console.log(`Successfully inserted ${insertedTaskTypes.length} default task types:`);
    
    insertedTaskTypes.forEach(taskType => {
      console.log(`- ${taskType.name}: ${taskType.description}`);
    });

    console.log('Task types seeding completed successfully');
  } catch (error) {
    console.error('Error seeding task types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedTaskTypes(); 