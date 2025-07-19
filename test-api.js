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
  console.log('Testing API endpoints...\n');
  
  try {
    // Test main route
    console.log('1. Testing main route...');
    const mainResult = await testAPI('https://engineering-office-backend.onrender.com/');
    console.log(`Status: ${mainResult.status}`);
    console.log(`Response: ${mainResult.data}\n`);
    
    // Test API test route
    console.log('2. Testing API test route...');
    const apiTestResult = await testAPI('https://engineering-office-backend.onrender.com/api/test');
    console.log(`Status: ${apiTestResult.status}`);
    console.log(`Response: ${apiTestResult.data}\n`);
    
    // Test projects test route
    console.log('3. Testing projects test route...');
    const projectsTestResult = await testAPI('https://engineering-office-backend.onrender.com/api/projects-test');
    console.log(`Status: ${projectsTestResult.status}`);
    console.log(`Response: ${projectsTestResult.data}\n`);
    
    // Test projects route
    console.log('4. Testing projects route...');
    const projectsResult = await testAPI('https://engineering-office-backend.onrender.com/api/projects');
    console.log(`Status: ${projectsResult.status}`);
    console.log(`Response: ${projectsResult.data}\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runTests(); 