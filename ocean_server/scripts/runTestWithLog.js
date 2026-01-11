#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test Runner with Logging
 * 
 * Runs individual test files and saves output to log files
 * 
 * Usage:
 *   node scripts/runTestWithLog.js auctionController
 *   node scripts/runTestWithLog.js productController
 *   node scripts/runTestWithLog.js groupBuyController
 *   node scripts/runTestWithLog.js subscriptionController
 * 
 * Or use npm scripts:
 *   npm run test:auction
 *   npm run test:product
 *   npm run test:groupbuy
 *   npm run test:subscription
 */

const testFileName = process.argv[2];

if (!testFileName) {
  console.error('❌ Please provide a test file name');
  console.log('\nUsage: node scripts/runTestWithLog.js <testFileName>');
  console.log('\nAvailable test files:');
  console.log('  - auctionController');
  console.log('  - productController');
  console.log('  - groupBuyController');
  console.log('  - subscriptionController');
  process.exit(1);
}

const testFilePath = path.join(__dirname, '..', 'tests', 'controllers', `${testFileName}.test.js`);

if (!fs.existsSync(testFilePath)) {
  console.error(`❌ Test file not found: ${testFilePath}`);
  process.exit(1);
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'test-logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, `${testFileName}-test.log`);
const timestamp = new Date().toISOString();

console.log(`\n🧪 Running test: ${testFileName}.test.js`);
console.log(`📝 Log file: ${logFilePath}`);
console.log(`⏰ Started at: ${timestamp}\n`);

// Clear previous log file and write header
fs.writeFileSync(logFilePath, `${'='.repeat(80)}\n`);
fs.appendFileSync(logFilePath, `Test Run: ${testFileName}\n`);
fs.appendFileSync(logFilePath, `Started at: ${timestamp}\n`);
fs.appendFileSync(logFilePath, `Test file: ${testFilePath}\n`);
fs.appendFileSync(logFilePath, `${'='.repeat(80)}\n\n`);

// Use relative path pattern that matches Jest's testMatch configuration
const testPathPattern = `tests/controllers/${testFileName}.test.js`;

// Run Jest with verbose output
const jestProcess = spawn('npx', [
  'jest',
  testPathPattern,
  '--verbose',
  '--no-coverage',
  '--detectOpenHandles',
  '--forceExit',
  '--no-cache'
], {
  cwd: path.join(__dirname, '..'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

let stdout = '';
let stderr = '';

// Capture stdout
jestProcess.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  process.stdout.write(output); // Also show in console
  fs.appendFileSync(logFilePath, output);
});

// Capture stderr
jestProcess.stderr.on('data', (data) => {
  const output = data.toString();
  stderr += output;
  process.stderr.write(output); // Also show in console
  fs.appendFileSync(logFilePath, output);
});

// Handle process completion
jestProcess.on('close', (code) => {
  const endTime = new Date().toISOString();
  
  fs.appendFileSync(logFilePath, `\n${'='.repeat(80)}\n`);
  fs.appendFileSync(logFilePath, `Ended at: ${endTime}\n`);
  fs.appendFileSync(logFilePath, `Exit code: ${code}\n`);
  fs.appendFileSync(logFilePath, `${'='.repeat(80)}\n`);
  
  if (code === 0) {
    console.log(`\n✅ Test completed successfully!`);
  } else {
    console.log(`\n❌ Test failed with exit code: ${code}`);
  }
  
  console.log(`\n📝 Full output saved to: ${logFilePath}`);
  console.log(`\n💡 To view the log file:`);
  console.log(`   - Open: ${logFilePath}`);
  console.log(`   - Or run: cat ${logFilePath} (Linux/Mac)`);
  console.log(`   - Or run: type ${logFilePath} (Windows)\n`);
  
  process.exit(code);
});

// Handle errors
jestProcess.on('error', (error) => {
  console.error(`\n❌ Error running test: ${error.message}`);
  fs.appendFileSync(logFilePath, `\n❌ Error: ${error.message}\n`);
  if (error.stack) {
    fs.appendFileSync(logFilePath, error.stack);
  }
  process.exit(1);
});
