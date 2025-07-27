const { MongoClient } = require('mongodb');
require('dotenv').config();

async function clearAllNotifications() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const database = client.db();
    const notifications = database.collection('notifications');
    
    // Count notifications before deletion
    const countBefore = await notifications.countDocuments();
    console.log(`📊 Found ${countBefore} notifications in database`);
    
    if (countBefore === 0) {
      console.log('✅ No notifications to delete');
      return;
    }
    
    // Delete all notifications
    const result = await notifications.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} notifications`);
    
    // Verify deletion
    const countAfter = await notifications.countDocuments();
    console.log(`📊 Remaining notifications: ${countAfter}`);
    
    if (countAfter === 0) {
      console.log('✅ All notifications deleted successfully!');
    } else {
      console.log('⚠️ Some notifications may still exist');
    }
    
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

clearAllNotifications(); 