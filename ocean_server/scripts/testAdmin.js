#!/usr/bin/env node

const AdminTestSuite = require('../tests/admin/adminTestSuite');
const bcrypt = require('bcryptjs');

/**
 * Admin System Testing Script
 * 
 * This script runs comprehensive tests for the Ocean App admin system.
 * It tests all admin functionality including:
 * - Authentication and authorization
 * - User management
 * - Seller management
 * - Analytics and reporting
 * - System administration
 * - Security and moderation
 * - Content management
 * 
 * Usage:
 *   node scripts/testAdmin.js
 *   npm run test:admin
 */

async function runAdminTests() {
  console.log('🚀 Starting Ocean App Admin System Tests...\n');
  
  const testSuite = new AdminTestSuite();
  let results = null;
  
  try {
    // Setup test environment
    await testSuite.setup();
    
    // Run all tests
    results = await testSuite.runAllTests();
    
    // Display results
    displayResults(results);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      await testSuite.cleanup();
    } catch (error) {
      console.error('⚠️ Cleanup failed:', error.message);
    }
  }
  
  // Exit with appropriate code
  if (results && results.failed > 0) {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

function displayResults(results) {
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    console.log('================');
    
    const failedTests = results.tests.filter(test => test.status === 'FAILED');
    failedTests.forEach(test => {
      console.log(`\n${test.suite}: ${test.name}`);
      console.log(`  Error: ${test.error}`);
    });
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  console.log('====================');
  
  // Group tests by suite
  const testsBySuite = {};
  results.tests.forEach(test => {
    if (!testsBySuite[test.suite]) {
      testsBySuite[test.suite] = [];
    }
    testsBySuite[test.suite].push(test);
  });
  
  Object.keys(testsBySuite).forEach(suite => {
    console.log(`\n${suite}:`);
    const suiteTests = testsBySuite[suite];
    const passed = suiteTests.filter(t => t.status === 'PASSED').length;
    const failed = suiteTests.filter(t => t.status === 'FAILED').length;
    
    console.log(`  ${passed} passed, ${failed} failed`);
    
    suiteTests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`    ${status} ${test.name}`);
    });
  });
}

// Performance testing function
async function runPerformanceTests() {
  console.log('\n⚡ Running Performance Tests...');
  
  const testSuite = new AdminTestSuite();
  await testSuite.setup();
  
  const performanceTests = [
    {
      name: 'Dashboard Load Time',
      test: async () => {
        const start = Date.now();
        const response = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${testSuite.adminToken}`);
        const duration = Date.now() - start;
        
        if (duration > 2000) {
          throw new Error(`Dashboard load time too slow: ${duration}ms`);
        }
        return duration;
      }
    },
    {
      name: 'User List Load Time',
      test: async () => {
        const start = Date.now();
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${testSuite.adminToken}`);
        const duration = Date.now() - start;
        
        if (duration > 1500) {
          throw new Error(`User list load time too slow: ${duration}ms`);
        }
        return duration;
      }
    },
    {
      name: 'Analytics Load Time',
      test: async () => {
        const start = Date.now();
        const response = await request(app)
          .get('/api/admin/analytics')
          .set('Authorization', `Bearer ${testSuite.adminToken}`);
        const duration = Date.now() - start;
        
        if (duration > 3000) {
          throw new Error(`Analytics load time too slow: ${duration}ms`);
        }
        return duration;
      }
    }
  ];
  
  const performanceResults = [];
  
  for (const perfTest of performanceTests) {
    try {
      const duration = await perfTest.test();
      performanceResults.push({ name: perfTest.name, duration, status: 'PASSED' });
      console.log(`  ✅ ${perfTest.name}: ${duration}ms`);
    } catch (error) {
      performanceResults.push({ name: perfTest.name, error: error.message, status: 'FAILED' });
      console.log(`  ❌ ${perfTest.name}: ${error.message}`);
    }
  }
  
  await testSuite.cleanup();
  
  console.log('\n📊 Performance Test Results:');
  performanceResults.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    const info = result.duration ? `${result.duration}ms` : result.error;
    console.log(`  ${status} ${result.name}: ${info}`);
  });
}

// Security testing function
async function runSecurityTests() {
  console.log('\n🔒 Running Security Tests...');
  
  const securityTests = [
    {
      name: 'Unauthorized Access Prevention',
      test: async () => {
        const response = await request(app)
          .get('/api/admin/dashboard');
        
        if (response.status !== 401) {
          throw new Error('Unauthorized access should return 401');
        }
      }
    },
    {
      name: 'Non-Admin Access Prevention',
      test: async () => {
        const userToken = jwt.sign(
          { id: 'user123', role: 'user' },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        const response = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${userToken}`);
        
        if (response.status !== 403) {
          throw new Error('Non-admin access should return 403');
        }
      }
    },
    {
      name: 'SQL Injection Prevention',
      test: async () => {
        const maliciousInput = "'; DROP TABLE users; --";
        
        const response = await request(app)
          .get(`/api/admin/users?search=${encodeURIComponent(maliciousInput)}`)
          .set('Authorization', `Bearer ${testSuite.adminToken}`);
        
        // Should not crash or return error
        if (response.status >= 500) {
          throw new Error('SQL injection attempt caused server error');
        }
      }
    }
  ];
  
  const securityResults = [];
  
  for (const securityTest of securityTests) {
    try {
      await securityTest.test();
      securityResults.push({ name: securityTest.name, status: 'PASSED' });
      console.log(`  ✅ ${securityTest.name}`);
    } catch (error) {
      securityResults.push({ name: securityTest.name, error: error.message, status: 'FAILED' });
      console.log(`  ❌ ${securityTest.name}: ${error.message}`);
    }
  }
  
  console.log('\n📊 Security Test Results:');
  securityResults.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    const info = result.error || 'PASSED';
    console.log(`  ${status} ${result.name}: ${info}`);
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--performance')) {
    runPerformanceTests().catch(console.error);
  } else if (args.includes('--security')) {
    runSecurityTests().catch(console.error);
  } else if (args.includes('--all')) {
    Promise.all([
      runAdminTests(),
      runPerformanceTests(),
      runSecurityTests()
    ]).catch(console.error);
  } else {
    runAdminTests().catch(console.error);
  }
}

module.exports = {
  runAdminTests,
  runPerformanceTests,
  runSecurityTests
};
