const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function fixOrphanedNotifications() {
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
    
    // Get admin users for reassignment
    const adminUsers = userList.filter(u => u.role === 'admin');
    const engineerUsers = userList.filter(u => u.role === 'engineer');
    
    console.log(`👑 Found ${adminUsers.length} admin users`);
    console.log(`🔧 Found ${engineerUsers.length} engineer users`);
    
    // Get all notifications
    const allNotifications = await notifications.find({}).toArray();
    console.log(`🔔 Found ${allNotifications.length} notifications to process`);
    
    // Create mapping for old IDs to new users
    const oldIdMapping = {
      '1': 'ms@nc.com',      // مصطفى صلاح
      'u1001': 'ar@nc.com',  // عمرو رمضان
      'u1002': 'mm@nc.com',  // محمد مجدي
      'u1003': 'ka@nc.com',  // كرم عبدالرحمن
    };
    
    let updatedNotifications = 0;
    let deletedNotifications = 0;
    
    for (const notification of allNotifications) {
      let needsUpdate = false;
      const updateData = {};
      
      // Check if userId is an old ID
      if (notification.userId && (oldIdMapping[notification.userId] || notification.userId === '1')) {
        let targetEmail = null;
        
        // Check if it's a known old ID
        if (oldIdMapping[notification.userId]) {
          targetEmail = oldIdMapping[notification.userId];
        } else if (notification.userId === '1') {
          targetEmail = 'ms@nc.com'; // Default to admin
        }
        
        if (targetEmail) {
          const targetUser = userList.find(u => u.email === targetEmail);
          if (targetUser) {
            updateData.userId = targetUser._id.toString();
            needsUpdate = true;
            console.log(`  🔄 Notification "${notification.title}": ${notification.userId} -> ${targetUser._id.toString()} (${targetUser.name})`);
          }
        }
      }
      
      // Check if userId is completely invalid (not in userList)
      if (notification.userId) {
        const user = userList.find(u => 
          u._id.toString() === notification.userId || 
          u.id === notification.userId
        );
        
        if (!user) {
          // Determine target user based on notification type
          let targetUser = null;
          
          if (notification.type === 'task' || notification.type === 'project') {
            // For task/project notifications, assign to first engineer
            targetUser = engineerUsers[0] || adminUsers[0];
          } else if (notification.type === 'system' || notification.type === 'finance') {
            // For system/finance notifications, assign to first admin
            targetUser = adminUsers[0];
          } else {
            // For other types, assign to first admin
            targetUser = adminUsers[0];
          }
          
          if (targetUser) {
            updateData.userId = targetUser._id.toString();
            needsUpdate = true;
            console.log(`  🔄 Notification "${notification.title}": invalid ${notification.userId} -> ${targetUser._id.toString()} (${targetUser.name})`);
          }
        }
      }
      
      // Check if triggeredBy is an old ID
      if (notification.triggeredBy && (oldIdMapping[notification.triggeredBy] || notification.triggeredBy === '1')) {
        let targetEmail = null;
        
        if (oldIdMapping[notification.triggeredBy]) {
          targetEmail = oldIdMapping[notification.triggeredBy];
        } else if (notification.triggeredBy === '1') {
          targetEmail = 'ms@nc.com';
        }
        
        if (targetEmail) {
          const targetUser = userList.find(u => u.email === targetEmail);
          if (targetUser) {
            updateData.triggeredBy = targetUser._id.toString();
            needsUpdate = true;
            console.log(`  🔄 Notification "${notification.title}" triggeredBy: ${notification.triggeredBy} -> ${targetUser._id.toString()} (${targetUser.name})`);
          }
        }
      }
      
      if (needsUpdate) {
        await notifications.updateOne(
          { _id: notification._id },
          { $set: updateData }
        );
        updatedNotifications++;
      }
    }
    
    console.log(`✅ Updated ${updatedNotifications} notifications`);
    
    // Final verification
    console.log('\n🔍 Final verification...');
    
    const finalNotifications = await notifications.find({}).toArray();
    const finalOrphanedNotifications = finalNotifications.filter(notification => {
      const user = userList.find(u => 
        u._id.toString() === notification.userId || 
        u.id === notification.userId
      );
      return !user;
    });
    
    if (finalOrphanedNotifications.length > 0) {
      console.log(`❌ Still found ${finalOrphanedNotifications.length} orphaned notifications`);
      finalOrphanedNotifications.forEach(notification => {
        console.log(`  - "${notification.title}" for user ID: ${notification.userId}`);
      });
    } else {
      console.log('✅ All notifications are now properly linked to users');
    }
    
    // Summary by user
    console.log('\n📊 Notifications by user:');
    userList.forEach(user => {
      const userNotifications = finalNotifications.filter(notification => 
        notification.userId === user._id.toString() || 
        notification.userId === user.id
      );
      console.log(`  ${user.name}: ${userNotifications.length} notifications`);
    });
    
    console.log('\n✅ Orphaned notification fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing orphaned notifications:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixOrphanedNotifications(); 