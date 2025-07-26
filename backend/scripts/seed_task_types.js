const mongoose = require('mongoose');
const TaskType = require('../models/TaskType');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://inspectionteam97:ZR2Tyf9iQyIuwGDc@office-management.cjyz0ld.mongodb.net/?retryWrites=true&w=majority&appName=Office-Management';

const defaultTaskTypes = [
  {
    name: "رسم مخططات معمارية",
    description: "رسم المخططات المعمارية الأساسية للمشروع",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "قرار مساحي",
    description: "إعداد القرار المساحي للمشروع",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "عمل فكرة مخطط معماري",
    description: "تطوير الفكرة الأولية للمخطط المعماري",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "مخطط سلامة",
    description: "إعداد مخطط السلامة للمشروع",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "رفع الرخصة",
    description: "رفع طلب الرخصة البلدية",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "مخطط انشائي",
    description: "إعداد المخططات الإنشائية",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "منظور 3D",
    description: "إنشاء منظور ثلاثي الأبعاد للمشروع",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seedTaskTypes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing default task types
    await TaskType.deleteMany({ isDefault: true });
    console.log('Cleared existing default task types');

    // Insert new default task types
    const insertedTaskTypes = await TaskType.insertMany(defaultTaskTypes);
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