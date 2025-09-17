// Test script to verify email service configuration
require('dotenv').config();
const { sendEmail, emailTemplates } = require('./src/services/emailService');

async function testEmailService() {
    console.log('🧪 Testing Email Service Configuration...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'NOT SET'}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '***SET***' : 'NOT SET'}`);
    console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || 'NOT SET'}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}\n`);
    
    if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ Email service not properly configured!');
        console.log('Please check your .env file and ensure all required variables are set.');
        return;
    }
    
    // Test email sending
    console.log('📧 Testing email sending...');
    try {
        const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
        const emailTemplate = emailTemplates.emailVerification('Test User', 'https://example.com/verify?token=test123');
        
        const result = await sendEmail(testEmail, emailTemplate.subject, emailTemplate.html, 'test');
        
        if (result) {
            console.log('✅ Email service test successful!');
            console.log(`📬 Test email sent to: ${testEmail}`);
            console.log('Check your inbox for the verification email.');
        } else {
            console.log('❌ Email service test failed!');
        }
    } catch (error) {
        console.log('❌ Email service test error:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Verify your Gmail App Password is correct');
        console.log('2. Ensure 2-Factor Authentication is enabled');
        console.log('3. Check if your hosting provider blocks SMTP ports');
        console.log('4. Consider switching to SendGrid for production');
    }
}

testEmailService();
