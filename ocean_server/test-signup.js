const { UserTable } = require('./models');

async function testUserCreation() {
  try {
    console.log('Testing UserTable model...');
    
    // Test creating a user
    const testUser = await UserTable.create({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      agreeTerms: true,
      accountType: 'buyer',
      accountStatus: 'active'
    });
    
    console.log('✅ User created successfully:', testUser.toJSON());
    
    // Clean up
    await testUser.destroy();
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testUserCreation(); 