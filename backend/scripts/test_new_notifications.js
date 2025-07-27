const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function testNewNotifications() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const database = client.db('test');
    const users = database.collection('users');
    const notifications = database.collection('notifications');
    
    // Get current users
    const userList = await users.find({}).toArray();
    console.log(`👥 Found ${userList.length} users`);
    
    // Test creating a new notification
    console.log('\n🧪 Testing new notification creation...');
    
    // Find a test user (engineer)
    const testUser = userList.find(u => u.role === 'engineer');
    if (!testUser) {
      console.log('❌ No engineer user found for testing');
      return;
    }
    
    console.log(`👤 Using test user: ${testUser.name} (${testUser.email}) - ID: ${testUser._id}`);
    
    // Create a test notification
    const testNotification = {
      id: Date.now().toString(),
      userId: testUser._id.toString(),
      title: "مهمة جديدة مُعيّنة لك",
      message: "تم تعيين مهمة \"مهمة اختبار\" لك بواسطة المدير",
      type: "task",
      actionUrl: "/tasks?highlight=test123",
      triggeredBy: userList.find(u => u.role === 'admin')?._id.toString() || "",
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    console.log('📝 Test notification data:', testNotification);
    
    // Try to insert the notification
    try {
      const result = await notifications.insertOne(testNotification);
      console.log('✅ Test notification created successfully:', result.insertedId);
      
      // Verify the notification was saved
      const savedNotification = await notifications.findOne({ _id: result.insertedId });
      console.log('✅ Notification saved correctly:', {
        id: savedNotification.id,
        userId: savedNotification.userId,
        title: savedNotification.title,
        type: savedNotification.type,
        isRead: savedNotification.isRead
      });
      
      // Clean up - delete the test notification
      await notifications.deleteOne({ _id: result.insertedId });
      console.log('🧹 Test notification cleaned up');
      
    } catch (error) {
      console.error('❌ Failed to create test notification:', error.message);
      
      // Check if it's a validation error
      if (error.message.includes('validation failed')) {
        console.log('🔍 Validation error details:', error);
      }
    }
    
    // Test notification types
    console.log('\n🔍 Testing different notification types...');
    
    const notificationTypes = ['task', 'project', 'finance', 'system', 'attendance', 'client'];
    
    for (const type of notificationTypes) {
      const typeTestNotification = {
        id: Date.now().toString() + '_' + type,
        userId: testUser._id.toString(),
        title: `إشعار اختبار - ${type}`,
        message: `هذا إشعار اختبار من نوع ${type}`,
        type: type,
        actionUrl: "/test",
        triggeredBy: "",
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      try {
        const result = await notifications.insertOne(typeTestNotification);
        console.log(`✅ ${type} notification created successfully`);
        await notifications.deleteOne({ _id: result.insertedId });
      } catch (error) {
        console.error(`❌ Failed to create ${type} notification:`, error.message);
      }
    }
    
    console.log('\n✅ New notification tests completed!');
    
  } catch (error) {
    console.error('❌ Error testing new notifications:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testNewNotifications(); 