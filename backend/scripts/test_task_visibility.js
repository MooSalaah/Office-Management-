const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function testTaskVisibility() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const database = client.db('test');
    const users = database.collection('users');
    const tasks = database.collection('tasks');
    
    // Get all users
    const userList = await users.find({}).toArray();
    console.log(`👥 Found ${userList.length} users:`);
    userList.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
    });
    
    // Get all tasks
    const allTasks = await tasks.find({}).toArray();
    console.log(`\n📋 Found ${allTasks.length} tasks:`);
    
    // Test task visibility for each user
    userList.forEach(user => {
      console.log(`\n🔍 Testing task visibility for ${user.name} (${user.role}):`);
      
      const userTasks = allTasks.filter(task => {
        if (user.role === 'admin') {
          return true; // Admin sees all tasks
        } else {
          return task.assigneeId === user._id.toString();
        }
      });
      
      console.log(`  Tasks visible: ${userTasks.length}`);
      userTasks.forEach(task => {
        const assignee = userList.find(u => u._id.toString() === task.assigneeId);
        const creator = userList.find(u => u._id.toString() === task.createdBy);
        console.log(`    - "${task.title}" - Assignee: ${assignee?.name || 'Unknown'} (${task.assigneeId}), Creator: ${creator?.name || 'Unknown'} (${task.createdBy})`);
      });
    });
    
    // Check for orphaned tasks
    console.log('\n🔍 Checking for orphaned tasks:');
    const orphanedTasks = allTasks.filter(task => {
      const assignee = userList.find(u => u._id.toString() === task.assigneeId);
      const creator = userList.find(u => u._id.toString() === task.createdBy);
      return !assignee || !creator;
    });
    
    if (orphanedTasks.length > 0) {
      console.log(`❌ Found ${orphanedTasks.length} orphaned tasks:`);
      orphanedTasks.forEach(task => {
        const assignee = userList.find(u => u._id.toString() === task.assigneeId);
        const creator = userList.find(u => u._id.toString() === task.createdBy);
        console.log(`  - "${task.title}" - Assignee: ${assignee?.name || 'MISSING'} (${task.assigneeId}), Creator: ${creator?.name || 'MISSING'} (${task.createdBy})`);
      });
    } else {
      console.log('✅ No orphaned tasks found');
    }
    
    console.log('\n✅ Task visibility test completed!');
    
  } catch (error) {
    console.error('❌ Error testing task visibility:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testTaskVisibility(); 