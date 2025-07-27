const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function testNotifications() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const database = client.db('test');
    const users = database.collection('users');
    const tasks = database.collection('tasks');
    const projects = database.collection('projects');
    const clients = database.collection('clients');
    const notifications = database.collection('notifications');
    
    // Get all data
    const userList = await users.find({}).toArray();
    const allTasks = await tasks.find({}).toArray();
    const allProjects = await projects.find({}).toArray();
    const allClients = await clients.find({}).toArray();
    const allNotifications = await notifications.find({}).toArray();
    
    console.log(`👥 Users: ${userList.length}`);
    console.log(`📋 Tasks: ${allTasks.length}`);
    console.log(`🏗️ Projects: ${allProjects.length}`);
    console.log(`👤 Clients: ${allClients.length}`);
    console.log(`🔔 Notifications: ${allNotifications.length}`);
    
    // Test notification creation for each user
    console.log('\n🔍 Testing notification creation for each user:');
    
    userList.forEach(user => {
      console.log(`\n👤 ${user.name} (${user.role}):`);
      
      // Find tasks assigned to this user
      const userTasks = allTasks.filter(task => 
        task.assigneeId === user._id.toString() || 
        task.assigneeId === user.id
      );
      
      // Find projects assigned to this user
      const userProjects = allProjects.filter(project => 
        project.assignedEngineerId === user._id.toString() || 
        project.assignedEngineerId === user.id ||
        project.team?.includes(user._id.toString()) ||
        project.team?.includes(user.id)
      );
      
      // Find notifications for this user
      const userNotifications = allNotifications.filter(notification => 
        notification.userId === user._id.toString() || 
        notification.userId === user.id
      );
      
      console.log(`  📋 Tasks assigned: ${userTasks.length}`);
      userTasks.forEach(task => {
        console.log(`    - "${task.title}" (ID: ${task.assigneeId})`);
      });
      
      console.log(`  🏗️ Projects assigned: ${userProjects.length}`);
      userProjects.forEach(project => {
        console.log(`    - "${project.name}" (Engineer ID: ${project.assignedEngineerId})`);
      });
      
      console.log(`  🔔 Notifications received: ${userNotifications.length}`);
      userNotifications.forEach(notification => {
        console.log(`    - "${notification.title}" (Type: ${notification.type})`);
      });
      
      // Check if user should have notifications but doesn't
      if (userTasks.length > 0 && userNotifications.length === 0) {
        console.log(`  ⚠️ WARNING: User has ${userTasks.length} tasks but no notifications!`);
      }
      
      if (userProjects.length > 0 && userNotifications.length === 0) {
        console.log(`  ⚠️ WARNING: User has ${userProjects.length} projects but no notifications!`);
      }
    });
    
    // Check for orphaned notifications
    console.log('\n🔍 Checking for orphaned notifications:');
    const orphanedNotifications = allNotifications.filter(notification => {
      const user = userList.find(u => 
        u._id.toString() === notification.userId || 
        u.id === notification.userId
      );
      return !user;
    });
    
    if (orphanedNotifications.length > 0) {
      console.log(`❌ Found ${orphanedNotifications.length} orphaned notifications:`);
      orphanedNotifications.forEach(notification => {
        console.log(`  - "${notification.title}" for user ID: ${notification.userId}`);
      });
    } else {
      console.log('✅ No orphaned notifications found');
    }
    
    // Test notification types
    console.log('\n📊 Notification types summary:');
    const notificationTypes = {};
    allNotifications.forEach(notification => {
      const type = notification.type || 'unknown';
      notificationTypes[type] = (notificationTypes[type] || 0) + 1;
    });
    
    Object.entries(notificationTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\n✅ Notification test completed!');
    
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testNotifications(); 