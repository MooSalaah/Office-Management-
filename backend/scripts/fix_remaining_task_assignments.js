const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function fixRemainingTaskAssignments() {
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
    
    // Create mapping for old IDs to new users
    const oldIdMapping = {
      'u1001': 'ar@nc.com', // عمرو رمضان
      'u1002': 'mm@nc.com', // محمد مجدي  
      'u1003': 'ka@nc.com', // كرم عبدالرحمن
      '1': 'ms@nc.com',     // مصطفى صلاح
      '2': 'mk@nc.com',     // محمد قطب
      '3': 'ar@nc.com',     // عمرو رمضان
      '4': 'mm@nc.com',     // محمد مجدي
      '5': 'ka@nc.com',     // كرم عبدالرحمن
      '6': 'am@nc.com',     // علي محمود
      '7': 'ma@nc.com',     // مروان أحمد
    };
    
    // Get all tasks
    const allTasks = await tasks.find({}).toArray();
    console.log(`📋 Found ${allTasks.length} tasks to process`);
    
    let updatedTasks = 0;
    for (const task of allTasks) {
      let needsUpdate = false;
      const updateData = {};
      
      // Fix assigneeId
      if (task.assigneeId) {
        let newAssigneeId = null;
        
        // Check if it's an old ID
        if (oldIdMapping[task.assigneeId]) {
          const targetEmail = oldIdMapping[task.assigneeId];
          const assignee = userList.find(u => u.email === targetEmail);
          if (assignee) {
            newAssigneeId = assignee._id.toString();
            updateData.assigneeName = assignee.name;
          }
        } else {
          // Check if it's an email
          const assignee = userList.find(u => u.email === task.assigneeId);
          if (assignee) {
            newAssigneeId = assignee._id.toString();
            updateData.assigneeName = assignee.name;
          } else {
            // Check if it's already a valid MongoDB ID
            const assignee = userList.find(u => u._id.toString() === task.assigneeId);
            if (assignee) {
              newAssigneeId = task.assigneeId;
              updateData.assigneeName = assignee.name;
            }
          }
        }
        
        if (newAssigneeId && newAssigneeId !== task.assigneeId) {
          updateData.assigneeId = newAssigneeId;
          needsUpdate = true;
          console.log(`  🔄 Task "${task.title}": assignee ${task.assigneeId} -> ${newAssigneeId}`);
        }
      }
      
      // Fix createdBy
      if (task.createdBy) {
        let newCreatedById = null;
        
        // Check if it's an old ID
        if (oldIdMapping[task.createdBy]) {
          const targetEmail = oldIdMapping[task.createdBy];
          const creator = userList.find(u => u.email === targetEmail);
          if (creator) {
            newCreatedById = creator._id.toString();
            updateData.createdByName = creator.name;
          }
        } else {
          // Check if it's an email
          const creator = userList.find(u => u.email === task.createdBy);
          if (creator) {
            newCreatedById = creator._id.toString();
            updateData.createdByName = creator.name;
          } else {
            // Check if it's already a valid MongoDB ID
            const creator = userList.find(u => u._id.toString() === task.createdBy);
            if (creator) {
              newCreatedById = task.createdBy;
              updateData.createdByName = creator.name;
            }
          }
        }
        
        if (newCreatedById && newCreatedById !== task.createdBy) {
          updateData.createdBy = newCreatedById;
          needsUpdate = true;
          console.log(`  🔄 Task "${task.title}": creator ${task.createdBy} -> ${newCreatedById}`);
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
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    
    const finalTasks = await tasks.find({}).toArray();
    console.log('\n📋 Final task assignments:');
    finalTasks.forEach(task => {
      const assignee = userList.find(u => u._id.toString() === task.assigneeId);
      const creator = userList.find(u => u._id.toString() === task.createdBy);
      console.log(`  "${task.title}" - Assignee: ${assignee?.name || 'Unknown'} (${task.assigneeId}), Creator: ${creator?.name || 'Unknown'} (${task.createdBy})`);
    });
    
    console.log('\n✅ Task assignment fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing task assignments:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixRemainingTaskAssignments(); 