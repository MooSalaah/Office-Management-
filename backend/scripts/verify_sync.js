const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log('Starting Sync Verification Test...');

    try {
        // 1. Create Project
        console.log('\n1. Creating Project...');
        const projectRes = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Sync Project ' + Date.now(),
                status: 'in-progress'
            })
        });
        const projectData = await projectRes.json();
        if (!projectData.success) throw new Error('Failed to create project: ' + projectData.error);
        const projectId = projectData.data.id || projectData.data._id;
        console.log('   Project Created:', projectId);

        // 2. Create Task
        console.log('\n2. Creating Task linked to Project...');
        const taskRes = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test Sync Task',
                projectId: projectId,
                status: 'todo'
            })
        });
        const taskData = await taskRes.json();
        if (!taskData.success) throw new Error('Failed to create task: ' + taskData.error);
        const taskId = taskData.data.id || taskData.data._id;
        console.log('   Task Created:', taskId);

        // 3. Test Task -> Project Sync
        console.log('\n3. Testing Task Completion -> Project Update...');
        const updateTaskRes = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        });
        const updateTaskData = await updateTaskRes.json();
        if (!updateTaskData.success) throw new Error('Failed to update task: ' + updateTaskData.error);
        console.log('   Task Updated to Completed.');

        // Check Project Status
        const checkProjectRes = await fetch(`${API_URL}/projects/${projectId}`);
        const checkProjectData = await checkProjectRes.json();
        const projectStatus = checkProjectData.data.status;
        const projectProgress = checkProjectData.data.progress;
        console.log(`   Project Status: ${projectStatus}, Progress: ${projectProgress}%`);

        if (projectStatus === 'completed' && projectProgress === 100) {
            console.log('   ✅ SUCCESS: Project automatically marked as completed.');
        } else {
            console.error('   ❌ FAILURE: Project NOT updated correctly.');
        }

        // 4. Test Project -> Task Sync
        console.log('\n4. Testing Project Completion -> Task Update...');
        // First, reset task to todo
        await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'todo' })
        });
        console.log('   Task reset to todo.');

        // Update Project to Completed
        const updateProjectRes = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        });
        const updateProjectData = await updateProjectRes.json();
        if (!updateProjectData.success) throw new Error('Failed to update project: ' + updateProjectData.error);
        console.log('   Project Updated to Completed manually.');

        // Check Task Status
        const checkTaskRes = await fetch(`${API_URL}/tasks/${taskId}`);
        const checkTaskData = await checkTaskRes.json();
        const taskStatus = checkTaskData.data.status;
        console.log(`   Task Status: ${taskStatus}`);

        if (taskStatus === 'completed') {
            console.log('   ✅ SUCCESS: Task automatically marked as completed.');
        } else {
            console.error('   ❌ FAILURE: Task NOT updated correctly.');
        }

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
    }
}

runTest();
