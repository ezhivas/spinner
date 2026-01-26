// Security Tests for Post-Request Scripts
// Run with: node security-tests.js

const API_URL = 'http://localhost:3000';

async function testSecurity() {
  console.log('🔒 Testing Post-Request Script Security\n');

  // Test 1: Block require()
  console.log('Test 1: Block require() attempt...');
  const test1 = {
    name: 'Security Test 1',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    postRequestScript: `
      const fs = require('fs');
      const data = fs.readFileSync('/etc/passwd');
      pm.environment.set('STOLEN', data);
    `
  };

  try {
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test1)
    });

    if (res.status === 400) {
      console.log('  ✅ PASS: Script blocked (HTTP 400)');
    } else {
      const result = await res.json();
      console.log('  ❌ FAIL: Script was accepted (should be blocked)');
      console.log('  Response:', result);
    }
  } catch (error) {
    console.log('  ✅ PASS: Request rejected or script blocked');
  }

  // Test 2: Block process.exit()
  console.log('\nTest 2: Block process.exit() attempt...');
  const test2 = {
    name: 'Security Test 2',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    postRequestScript: `
      process.exit(1);
    `
  };

  try {
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test2)
    });

    if (res.status === 400) {
      console.log('  ✅ PASS: Script blocked (HTTP 400)');
    } else {
      console.log('  ❌ FAIL: Script was accepted (should be blocked)');
    }
  } catch (error) {
    console.log('  ✅ PASS: Request rejected or script blocked');
  }

  // Test 3: Block eval()
  console.log('\nTest 3: Block eval() attempt...');
  const test3 = {
    name: 'Security Test 3',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    postRequestScript: `
      eval('console.log("hacked")');
    `
  };

  try {
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test3)
    });

    if (res.status === 400) {
      console.log('  ✅ PASS: Script blocked (HTTP 400)');
    } else {
      console.log('  ❌ FAIL: Script was accepted (should be blocked)');
    }
  } catch (error) {
    console.log('  ✅ PASS: Request rejected or script blocked');
  }

  // Test 4: Allow valid script
  console.log('\nTest 4: Allow valid script...');
  const test4 = {
    name: 'Security Test 4 - Valid',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    postRequestScript: `
      const data = pm.response.json();
      console.log('User:', data.name);
      pm.environment.set('TEST_USER_ID', data.id);
    `
  };

  try {
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test4)
    });

    if (res.ok) {
      console.log('  ✅ PASS: Valid script accepted');
    } else {
      console.log('  ❌ FAIL: Valid script rejected');
    }
  } catch (error) {
    console.log('  ❌ FAIL: Valid script rejected -', error.message);
  }

  console.log('\n🎯 Security tests completed!');
}

testSecurity().catch(console.error);
