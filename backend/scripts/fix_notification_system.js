const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function fixNotificationSystem() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const database = client.db('test');
    const users = database.collection('users');
    const notifications = database.collection('notifications');
    const tasks = database.collection('tasks');
    const projects = database.collection('projects');
    const clients = database.collection('clients');
    
    // Get all data
    const userList = await users.find({}).toArray();
    const allNotifications = await notifications.find({}).toArray();
    const allTasks = await tasks.find({}).toArray();
    const allProjects = await projects.find({}).toArray();
    const allClients = await clients.find({}).toArray();
    
    console.log(`👥 Users: ${userList.length}`);
    console.log(`🔔 Notifications: ${allNotifications.length}`);
    console.log(`📋 Tasks: ${allTasks.length}`);
    console.log(`🏗️ Projects: ${allProjects.length}`);
    console.log(`👤 Clients: ${allClients.length}`);
    
    // Step 1: Fix orphaned notifications
    console.log('\n🔧 Step 1: Fixing orphaned notifications...');
    
    const orphanedNotifications = allNotifications.filter(notification => {
      const user = userList.find(u => 
        u._id.toString() === notification.userId || 
        u.id === notification.userId
      );
      return !user;
    });
    
    console.log(`Found ${orphanedNotifications.length} orphaned notifications`);
    
    // Delete orphaned notifications
    if (orphanedNotifications.length > 0) {
      const orphanedIds = orphanedNotifications.map(n => n._id);
      const deleteResult = await notifications.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`Deleted ${deleteResult.deletedCount} orphaned notifications`);
    }
    
    // Step 2: Create missing notifications for tasks
    console.log('\n🔧 Step 2: Creating missing task notifications...');
    
    let createdTaskNotifications = 0;
    for (const task of allTasks) {
      if (task.assigneeId) {
        // Check if notification already exists
        const existingNotification = await notifications.findOne({
          userId: task.assigneeId,
          type: 'task',
          'message': { $regex: task.title, $options: 'i' }
        });
        
        if (!existingNotification) {
          const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: task.assigneeId,
            title: "مهمة جديدة مُعيّنة لك",
            message: `تم تعيين مهمة "${task.title}" لك`,
            type: "task",
            isRead: false,
            actionUrl: `/tasks`,
            triggeredBy: task.createdBy || "system",
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await notifications.insertOne(notification);
          createdTaskNotifications++;
        }
      }
    }
    
    console.log(`Created ${createdTaskNotifications} missing task notifications`);
    
    // Step 3: Create missing notifications for projects
    console.log('\n🔧 Step 3: Creating missing project notifications...');
    
    let createdProjectNotifications = 0;
    for (const project of allProjects) {
      if (project.assignedEngineerId) {
        // Check if notification already exists
        const existingNotification = await notifications.findOne({
          userId: project.assignedEngineerId,
          type: 'project',
          'message': { $regex: project.name, $options: 'i' }
        });
        
        if (!existingNotification) {
          const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: project.assignedEngineerId,
            title: "مشروع جديد مُعيّن لك",
            message: `تم تعيين مشروع "${project.name}" لك`,
            type: "project",
            isRead: false,
            actionUrl: `/projects`,
            triggeredBy: project.createdBy || "system",
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await notifications.insertOne(notification);
          createdProjectNotifications++;
        }
      }
    }
    
    console.log(`Created ${createdProjectNotifications} missing project notifications`);
    
    // Step 4: Create missing notifications for clients (for admins)
    console.log('\n🔧 Step 4: Creating missing client notifications...');
    
    let createdClientNotifications = 0;
    const adminUsers = userList.filter(user => user.role === 'admin');
    
    for (const client of allClients) {
      for (const admin of adminUsers) {
        // Check if notification already exists
        const existingNotification = await notifications.findOne({
          userId: admin._id.toString(),
          type: 'client',
          'message': { $regex: client.name, $options: 'i' }
        });
        
        if (!existingNotification) {
          const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: admin._id.toString(),
            title: "عميل جديد",
            message: `تم إضافة عميل جديد: "${client.name}"`,
            type: "client",
            isRead: false,
            actionUrl: `/clients`,
            triggeredBy: "system",
            createdAt: client.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await notifications.insertOne(notification);
          createdClientNotifications++;
        }
      }
    }
    
    console.log(`Created ${createdClientNotifications} missing client notifications`);
    
    // Step 5: Update notification structure
    console.log('\n🔧 Step 5: Updating notification structure...');
    
    const updateResult = await notifications.updateMany(
      { updatedAt: { $exists: false } },
      { $set: { updatedAt: new Date().toISOString() } }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} notifications with updatedAt field`);
    
    // Step 6: Final verification
    console.log('\n🔧 Step 6: Final verification...');
    
    const finalNotifications = await notifications.find({}).toArray();
    const finalOrphanedNotifications = finalNotifications.filter(notification => {
      const user = userList.find(u => 
        u._id.toString() === notification.userId || 
        u.id === notification.userId
      );
      return !user;
    });
    
    console.log(`Final notification count: ${finalNotifications.length}`);
    console.log(`Final orphaned notifications: ${finalOrphanedNotifications.length}`);
    
    // Step 7: Create indexes for better performance
    console.log('\n🔧 Step 7: Creating database indexes...');
    
    try {
      await notifications.createIndex({ userId: 1 });
      await notifications.createIndex({ isRead: 1 });
      await notifications.createIndex({ type: 1 });
      await notifications.createIndex({ createdAt: -1 });
      await notifications.createIndex({ id: 1 }); // Add this line for the new index
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.log('⚠️ Some indexes may already exist:', error.message);
    }
    
    console.log('\n✅ Notification system fix completed successfully!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`- Deleted ${orphanedNotifications.length} orphaned notifications`);
    console.log(`- Created ${createdTaskNotifications} task notifications`);
    console.log(`- Created ${createdProjectNotifications} project notifications`);
    console.log(`- Created ${createdClientNotifications} client notifications`);
    console.log(`- Updated ${updateResult.modifiedCount} notifications structure`);
    console.log(`- Final notifications: ${finalNotifications.length}`);
    
  } catch (error) {
    console.error('❌ Error fixing notification system:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixNotificationSystem(); 