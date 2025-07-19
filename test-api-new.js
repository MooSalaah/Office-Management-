const https = require('https');

function testAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runTests() {
  console.log('Testing Backend API endpoints...\n');
  
  try {
    // Test main route
    console.log('1. Testing main route...');
    const mainResult = await testAPI('https://engineering-office-backend.onrender.com/');
    console.log(`Status: ${mainResult.status}`);
    console.log(`Response: ${mainResult.data}\n`);
    
    // Test simple routes directly in server.js
    console.log('2. Testing projects simple route...');
    const projectsSimpleResult = await testAPI('https://engineering-office-backend.onrender.com/api/projects-simple');
    console.log(`Status: ${projectsSimpleResult.status}`);
    console.log(`Response: ${projectsSimpleResult.data}\n`);
    
    console.log('3. Testing tasks simple route...');
    const tasksSimpleResult = await testAPI('https://engineering-office-backend.onrender.com/api/tasks-simple');
    console.log(`Status: ${tasksSimpleResult.status}`);
    console.log(`Response: ${tasksSimpleResult.data}\n`);
    
    console.log('4. Testing clients simple route...');
    const clientsSimpleResult = await testAPI('https://engineering-office-backend.onrender.com/api/clients-simple');
    console.log(`Status: ${clientsSimpleResult.status}`);
    console.log(`Response: ${clientsSimpleResult.data}\n`);
    
    console.log('5. Testing users simple route...');
    const usersSimpleResult = await testAPI('https://engineering-office-backend.onrender.com/api/users-simple');
    console.log(`Status: ${usersSimpleResult.status}`);
    console.log(`Response: ${usersSimpleResult.data}\n`);
    
    // Test MongoDB connection by checking if database routes work
    console.log('6. Testing MongoDB connection via projects route...');
    const projectsResult = await testAPI('https://engineering-office-backend.onrender.com/api/projects');
    console.log(`Status: ${projectsResult.status}`);
    console.log(`Response: ${projectsResult.data}\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runTests(); 