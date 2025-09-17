// Test script to verify email service configuration
require('dotenv').config();
const { sendEmail, emailTemplates } = require('./src/services/emailService');

async function testEmailService() {
    console.log('🧪 Testing Email Service Configuration...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'NOT SET'}`);
    
    if (process.env.EMAIL_SERVICE === 'gmail') {
        console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
        console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '***SET***' : 'NOT SET'}`);
        console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || 'NOT SET'}`);
    } else if (process.env.EMAIL_SERVICE === 'brevo') {
        console.log(`BREVO_SMTP_USER: ${process.env.BREVO_SMTP_USER || process.env.EMAIL_USER || 'NOT SET'}`);
        console.log(`BREVO_SMTP_PASS: ${(process.env.BREVO_SMTP_PASS || process.env.EMAIL_PASS) ? '***SET***' : 'NOT SET'}`);
        console.log(`BREVO_FROM_EMAIL: ${process.env.BREVO_FROM_EMAIL || process.env.FROM_EMAIL || 'NOT SET'}`);
        console.log(`BREVO_SMTP_HOST: ${process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com'}`);
        console.log(`BREVO_SMTP_PORT: ${process.env.BREVO_SMTP_PORT || '587'}`);
    }
    
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}\n`);
    
    // Check if email service is properly configured
    let isConfigured = false;
    if (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        isConfigured = true;
    } else if (process.env.EMAIL_SERVICE === 'brevo' && 
               (process.env.BREVO_SMTP_USER || process.env.EMAIL_USER) && 
               (process.env.BREVO_SMTP_PASS || process.env.EMAIL_PASS)) {
        isConfigured = true;
    }
    
    if (!isConfigured) {
        console.log('❌ Email service not properly configured!');
        console.log('Please check your .env file and ensure all required variables are set.');
        console.log('For Gmail: EMAIL_SERVICE=gmail, EMAIL_USER, EMAIL_PASS');
        console.log('For Brevo: EMAIL_SERVICE=brevo, BREVO_SMTP_USER, BREVO_SMTP_PASS');
        return;
    }
    
    // Test email sending
    console.log('📧 Testing email sending...');
    try {
        // Get the appropriate test email based on service
        let testEmail;
        if (process.env.EMAIL_SERVICE === 'gmail') {
            testEmail = process.env.EMAIL_USER;
        } else if (process.env.EMAIL_SERVICE === 'brevo') {
            // For Brevo, use FROM_EMAIL or TEST_EMAIL instead of SMTP_USER
            testEmail = process.env.TEST_EMAIL || process.env.BREVO_FROM_EMAIL || process.env.FROM_EMAIL || process.env.EMAIL_USER;
        }
        
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
        if (process.env.EMAIL_SERVICE === 'gmail') {
            console.log('1. Verify your Gmail App Password is correct');
            console.log('2. Ensure 2-Factor Authentication is enabled');
            console.log('3. Check if your hosting provider blocks SMTP ports');
            console.log('4. Consider switching to Brevo or SendGrid for production');
        } else if (process.env.EMAIL_SERVICE === 'brevo') {
            console.log('1. Verify your Brevo SMTP credentials are correct');
            console.log('2. Ensure your sender email is verified in Brevo');
            console.log('3. Check if your hosting provider blocks SMTP ports');
            console.log('4. Try using port 465 instead of 587 if STARTTLS fails');
        }
    }
}

testEmailService();
