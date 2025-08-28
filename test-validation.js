// Test script to verify validation functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testValidation() {
  console.log('🧪 Testing Form Validation...\n');

  // Test 1: Register with invalid data
  console.log('1. Testing registration with invalid data:');
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      name: 'A', // Too short
      email: 'invalid-email', // Invalid format
      password: '123', // Too weak
      phone_no: 'abc', // Invalid phone
      address: 'Hi' // Too short
    });
  } catch (error) {
    console.log('✅ Registration validation working:', error.response?.data?.message);
  }

  // Test 2: Register with valid data
  console.log('\n2. Testing registration with valid data:');
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!',
      phone_no: '+1234567890',
      address: '123 Test Street, Test City'
    });
    console.log('✅ Registration successful:', response.data.message);
  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log('✅ User already exists (expected)');
    } else {
      console.log('❌ Registration failed:', error.response?.data?.message);
    }
  }

  // Test 3: Login with invalid data
  console.log('\n3. Testing login with invalid data:');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'invalid-email',
      password: '123'
    });
  } catch (error) {
    console.log('✅ Login validation working:', error.response?.data?.message);
  }

  // Test 4: Login with valid data
  console.log('\n4. Testing login with valid data:');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPass123!'
    });
    console.log('✅ Login successful');
    
    // Test bookmark functionality
    const token = response.data.token;
    console.log('\n5. Testing bookmark functionality:');
    
    // Get notes first
    const notesResponse = await axios.get(`${API_BASE}/notes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (notesResponse.data.data && notesResponse.data.data.length > 0) {
      const noteId = notesResponse.data.data[0]._id;
      
      // Add bookmark
      const bookmarkResponse = await axios.post(`${API_BASE}/notes/${noteId}/bookmark`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Bookmark toggle:', bookmarkResponse.data.message);
      
      // Get bookmarks
      const bookmarksResponse = await axios.get(`${API_BASE}/notes/bookmarks/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Bookmarks retrieved:', bookmarksResponse.data.length, 'bookmarks');
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message);
  }

  console.log('\n🎉 Validation tests completed!');
}

testValidation().catch(console.error);