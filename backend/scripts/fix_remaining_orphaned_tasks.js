const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function fixRemainingOrphanedTasks() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const database = client.db('test');
    const users = database.collection('users');
    const tasks = database.collection('tasks');
    
    // Get current users
    const userList = await users.find({}).toArray();
    console.log(`👥 Found ${userList.length} users`);
    
    // Get admin and engineer users for reassignment
    const adminUsers = userList.filter(u => u.role === 'admin');
    const engineerUsers = userList.filter(u => u.role === 'engineer');
    
    console.log(`👑 Found ${adminUsers.length} admin users`);
    console.log(`🔧 Found ${engineerUsers.length} engineer users`);
    
    // Get all tasks
    const allTasks = await tasks.find({}).toArray();
    console.log(`📋 Found ${allTasks.length} tasks to process`);
    
    let updatedTasks = 0;
    for (const task of allTasks) {
      let needsUpdate = false;
      const updateData = {};
      
      // Check if assigneeId is an old ID (u1001, u1002, etc.)
      if (task.assigneeId && (task.assigneeId.startsWith('u') || task.assigneeId === '1' || task.assigneeId === '2')) {
        // Map old IDs to new users
        const oldIdMapping = {
          'u1001': 'mm@nc.com', // محمد مجدي
          'u1002': 'ka@nc.com', // كرم عبدالرحمن
          '1': 'ar@nc.com',     // عمرو رمضان
          '2': 'mm@nc.com',     // محمد مجدي
        };
        
        const targetEmail = oldIdMapping[task.assigneeId];
        if (targetEmail) {
          const assignee = userList.find(u => u.email === targetEmail);
          if (assignee) {
            updateData.assigneeId = assignee._id.toString();
            updateData.assigneeName = assignee.name;
            needsUpdate = true;
            console.log(`  🔄 Task "${task.title}": reassigning old assignee ID ${task.assigneeId} -> ${assignee._id.toString()} (${assignee.name})`);
          }
        }
      }
      
      // Check if createdBy is an old ID
      if (task.createdBy && (task.createdBy.startsWith('u') || task.createdBy === '1' || task.createdBy === '2')) {
        // Map old IDs to new users
        const oldIdMapping = {
          'u1001': 'mm@nc.com', // محمد مجدي
          'u1002': 'ka@nc.com', // كرم عبدالرحمن
          '1': 'ar@nc.com',     // عمرو رمضان
          '2': 'mm@nc.com',     // محمد مجدي
        };
        
        const targetEmail = oldIdMapping[task.createdBy];
        if (targetEmail) {
          const creator = userList.find(u => u.email === targetEmail);
          if (creator) {
            updateData.createdBy = creator._id.toString();
            updateData.createdByName = creator.name;
            needsUpdate = true;
            console.log(`  🔄 Task "${task.title}": reassigning old creator ID ${task.createdBy} -> ${creator._id.toString()} (${creator.name})`);
          }
        }
      }
      
      // Check if assigneeId or createdBy is completely invalid (not in userList)
      if (task.assigneeId) {
        const assignee = userList.find(u => u._id.toString() === task.assigneeId);
        if (!assignee) {
          // Reassign to first available engineer
          const newAssignee = engineerUsers[0] || adminUsers[0];
          updateData.assigneeId = newAssignee._id.toString();
          updateData.assigneeName = newAssignee.name;
          needsUpdate = true;
          console.log(`  🔄 Task "${task.title}": reassigning invalid assignee ${task.assigneeId} -> ${newAssignee._id.toString()} (${newAssignee.name})`);
        }
      }
      
      if (task.createdBy) {
        const creator = userList.find(u => u._id.toString() === task.createdBy);
        if (!creator) {
          // Reassign to first available admin
          const newCreator = adminUsers[0];
          updateData.createdBy = newCreator._id.toString();
          updateData.createdByName = newCreator.name;
          needsUpdate = true;
          console.log(`  🔄 Task "${task.title}": reassigning invalid creator ${task.createdBy} -> ${newCreator._id.toString()} (${newCreator.name})`);
        }
      }
      
      if (needsUpdate) {
        await tasks.updateOne(
          { _id: task._id },
          { $set: updateData }
        );
        updatedTasks++;
      }
    }
    
    console.log(`✅ Updated ${updatedTasks} tasks`);
    
    // Final verification
    console.log('\n🔍 Final verification...');
    
    const finalTasks = await tasks.find({}).toArray();
    console.log('\n📋 Final task assignments:');
    finalTasks.forEach(task => {
      const assignee = userList.find(u => u._id.toString() === task.assigneeId);
      const creator = userList.find(u => u._id.toString() === task.createdBy);
      console.log(`  "${task.title}" - Assignee: ${assignee?.name || 'Unknown'} (${task.assigneeId}), Creator: ${creator?.name || 'Unknown'} (${task.createdBy})`);
    });
    
    console.log('\n✅ Orphaned task fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing orphaned tasks:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixRemainingOrphanedTasks(); 