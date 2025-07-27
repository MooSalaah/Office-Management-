const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function fixUserAndTaskIssues() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const database = client.db('test');
    const users = database.collection('users');
    const tasks = database.collection('tasks');
    
    // 1. Fix user data - ensure all users have correct emails and IDs
    console.log('\n🔧 Fixing user data...');
    
    const userUpdates = [
      {
        name: "مصطفى صلاح",
        email: "ms@nc.com",
        password: "ms@nc.com",
        role: "admin",
        phone: "",
        avatar: "",
        isActive: true,
        permissions: ["view_dashboard", "view_projects", "view_tasks", "view_clients", "view_finance", "view_settings", "view_attendance", "create_projects", "edit_projects", "delete_projects", "create_tasks", "edit_tasks", "delete_tasks", "create_clients", "edit_clients", "delete_clients", "create_transactions", "edit_transactions", "delete_transactions", "create_users", "edit_users", "delete_users", "view_reports"],
        monthlySalary: 15000,
        createdAt: new Date().toISOString(),
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          eveningStart: "13:00",
          eveningEnd: "17:00"
        }
      },
      {
        name: "محمد قطب",
        email: "mk@nc.com",
        password: "mk@nc.com",
        role: "admin",
        phone: "",
        avatar: "",
        isActive: true,
        permissions: ["view_dashboard", "view_projects", "view_tasks", "view_clients", "view_finance", "view_settings", "view_attendance", "create_projects", "edit_projects", "delete_projects", "create_tasks", "edit_tasks", "delete_tasks", "create_clients", "edit_clients", "delete_clients", "create_transactions", "edit_transactions", "delete_transactions", "create_users", "edit_users", "delete_users", "view_reports"],
        monthlySalary: 15000,
        createdAt: new Date().toISOString(),
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          eveningStart: "13:00",
          eveningEnd: "17:00"
        }
      },
      {
        name: "عمرو رمضان",
        email: "ar@nc.com",
        password: "ar@nc.com",
        role: "engineer",
        phone: "",
        avatar: "",
        isActive: true,
        permissions: ["view_dashboard", "view_projects", "view_tasks", "view_clients", "view_finance", "view_attendance", "create_tasks", "edit_tasks", "create_clients", "edit_clients"],
        monthlySalary: 8000,
        createdAt: new Date().toISOString(),
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          eveningStart: "13:00",
          eveningEnd: "17:00"
        }
      },
      {
        name: "محمد مجدي",
        email: "mm@nc.com",
        password: "mm@nc.com",
        role: "engineer",
        phone: "",
        avatar: "",
        isActive: true,
        permissions: ["view_dashboard", "view_projects", "view_tasks", "view_clients", "view_finance", "view_attendance", "create_tasks", "edit_tasks", "create_clients", "edit_clients"],
        monthlySalary: 8000,
        createdAt: new Date().toISOString(),
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          eveningStart: "13:00",
          eveningEnd: "17:00"
        }
      },
      {
        name: "كرم عبدالرحمن",
        email: "ka@nc.com",
        password: "ka@nc.com",
        role: "engineer",
        phone: "",
        avatar: "",
        isActive: true,
        permissions: ["view_dashboard", "view_projects", "view_tasks", "view_clients", "view_finance", "view_attendance", "create_tasks", "edit_tasks", "create_clients", "edit_clients"],
        monthlySalary: 8000,
        createdAt: new Date().toISOString(),
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          eveningStart: "13:00",
          eveningEnd: "17:00"
        }
      },
      {
        name: "علي محمود",
        email: "am@nc.com",
        password: "am@nc.com",
        role: "accountant",
        phone: "",
        avatar: "",
        isActive: true,
        permissions: ["view_dashboard", "view_projects", "view_tasks", "view_clients", "view_finance", "view_attendance", "create_transactions", "edit_transactions", "delete_transactions"],
        monthlySalary: 6000,
        createdAt: new Date().toISOString(),
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          eveningStart: "13:00",
          eveningEnd: "17:00"
        }
      },
      {
        name: "مروان أحمد",
        email: "ma@nc.com",
        password: "ma@nc.com",
        role: "hr",
        phone: "",
        avatar: "",
        isActive: true,
        permissions: ["view_dashboard", "view_projects", "view_tasks", "view_clients", "view_finance", "view_settings", "view_attendance", "create_users", "edit_users", "delete_users"],
        monthlySalary: 7000,
        createdAt: new Date().toISOString(),
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          eveningStart: "13:00",
          eveningEnd: "17:00"
        }
      }
    ];
    
    // Clear existing users and insert new ones
    await users.deleteMany({});
    console.log('🗑️ Cleared existing users');
    
    const insertResult = await users.insertMany(userUpdates);
    console.log(`✅ Inserted ${insertResult.insertedCount} users`);
    
    // 2. Get user IDs for task assignment
    const userList = await users.find({}).toArray();
    const userIdMap = {};
    userList.forEach(user => {
      userIdMap[user.email] = user._id.toString();
    });
    
    console.log('\n👥 User ID mapping:');
    Object.entries(userIdMap).forEach(([email, id]) => {
      console.log(`  ${email} -> ${id}`);
    });
    
    // 3. Fix task assignments
    console.log('\n🔧 Fixing task assignments...');
    
    const allTasks = await tasks.find({}).toArray();
    console.log(`📋 Found ${allTasks.length} tasks to process`);
    
    let updatedTasks = 0;
    for (const task of allTasks) {
      let needsUpdate = false;
      const updateData = {};
      
      // Fix assigneeId if it's an email or old ID
      if (task.assigneeId) {
        const assignee = userList.find(u => 
          u.email === task.assigneeId || 
          u._id.toString() === task.assigneeId ||
          u.name === task.assigneeId
        );
        
        if (assignee && task.assigneeId !== assignee._id.toString()) {
          updateData.assigneeId = assignee._id.toString();
          updateData.assigneeName = assignee.name;
          needsUpdate = true;
          console.log(`  🔄 Task "${task.title}": ${task.assigneeId} -> ${assignee._id.toString()} (${assignee.name})`);
        }
      }
      
      // Fix createdBy if it's an email or old ID
      if (task.createdBy) {
        const creator = userList.find(u => 
          u.email === task.createdBy || 
          u._id.toString() === task.createdBy ||
          u.name === task.createdBy
        );
        
        if (creator && task.createdBy !== creator._id.toString()) {
          updateData.createdBy = creator._id.toString();
          updateData.createdByName = creator.name;
          needsUpdate = true;
          console.log(`  🔄 Task "${task.title}" creator: ${task.createdBy} -> ${creator._id.toString()} (${creator.name})`);
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
    
    // 4. Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    
    const finalTasks = await tasks.find({}).toArray();
    console.log('\n📋 Final task assignments:');
    finalTasks.forEach(task => {
      const assignee = userList.find(u => u._id.toString() === task.assigneeId);
      const creator = userList.find(u => u._id.toString() === task.createdBy);
      console.log(`  "${task.title}" - Assignee: ${assignee?.name || 'Unknown'} (${task.assigneeId}), Creator: ${creator?.name || 'Unknown'} (${task.createdBy})`);
    });
    
    console.log('\n✅ User and task fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing user and task issues:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixUserAndTaskIssues(); 