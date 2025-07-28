const mongoose = require('mongoose');
const Notification = require('../models/Notification');
require('dotenv').config();

const clearAllNotifications = async () => {
  try {
    // الاتصال بقاعدة البيانات
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });

    console.log('✅ Connected to MongoDB successfully!');

    // حذف جميع الإشعارات
    console.log('🗑️ Deleting all notifications...');
    const result = await Notification.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} notifications from database`);
    
    // إغلاق الاتصال
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    process.exit(1);
  }
};

// تشغيل الدالة
clearAllNotifications(); 