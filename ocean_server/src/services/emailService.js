// Email service for notifications
// This is a placeholder service that can be integrated with your preferred email provider

const sendEmail = async (to, subject, message, type = 'info') => {
  try {
    // Check if email service is configured
    if (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use Gmail with App Password
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS // This should be your Gmail App Password
        }
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: message
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via Gmail:', to);
      return true;
    } else {
      // Fallback to console logging for development
      console.log('📧 EMAIL SERVICE - Sending email:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log(`Type: ${type}`);
      console.log('---');
      console.log('⚠️  Email service not configured. Add EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS to .env');
      return true;
    }

    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: to,
      from: process.env.FROM_EMAIL,
      subject: subject,
      html: message,
    };
    
    await sgMail.send(msg);
    */

    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
};

// Email templates
const emailTemplates = {
  sellerApplicationSubmitted: (userName) => ({
    subject: "Seller Application Submitted - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Hello ${userName}!</h2>
        <p>Your seller application has been submitted successfully and is currently under review.</p>
        <p>We'll notify you once the review process is complete. This usually takes 1-3 business days.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #27ae60;">What happens next?</h3>
          <ul>
            <li>Our team will review your application</li>
            <li>We'll verify your business documents</li>
            <li>You'll receive an email with the decision</li>
          </ul>
        </div>
        <p>Thank you for choosing Ocean App!</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),
  
  sellerApplicationApproved: (userName, businessName) => ({
    subject: "🎉 Your Seller Application is Approved! - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Congratulations ${userName}!</h2>
        <p>Great news! Your seller application for <strong>${businessName}</strong> has been approved!</p>
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #155724;">You can now:</h3>
          <ul>
            <li>Start listing your products</li>
            <li>Receive orders from customers</li>
            <li>Access your seller dashboard</li>
            <li>Manage your business profile</li>
          </ul>
        </div>
        <p>Welcome to the Ocean App seller community!</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),
  
  sellerApplicationRejected: (userName, reason) => ({
    subject: "Seller Application Update - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Hello ${userName}</h2>
        <p>We regret to inform you that your seller application was not approved at this time.</p>
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #721c24;">Reason for rejection:</h3>
          <p>${reason}</p>
        </div>
        <p>You can submit a new application after addressing the issues mentioned above.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),
  
  accountSuspended: (userName, reason) => ({
    subject: "Account Suspended - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Hello ${userName}</h2>
        <p>Your account has been suspended due to a policy violation.</p>
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #721c24;">Reason for suspension:</h3>
          <p>${reason}</p>
        </div>
        <p>Please contact our support team to discuss reinstating your account.</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),
  
  accountActivated: (userName) => ({
    subject: "Account Reactivated - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Hello ${userName}</h2>
        <p>Great news! Your account has been reactivated.</p>
        <p>You can now continue using our platform normally.</p>
        <p>Thank you for your patience.</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  emailVerification: (userName, verificationLink) => ({
    subject: "Verify Your Email - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Hello ${userName}!</h2>
        <p>Welcome to Ocean App! Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #3498db; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #7f8c8d;">${verificationLink}</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50;">What happens next?</h3>
          <ul>
            <li>Click the verification link above</li>
            <li>Your account will be activated</li>
            <li>You can start using Ocean App</li>
          </ul>
        </div>
        <p><strong>Note:</strong> This link will expire in 24 hours for security reasons.</p>
        <p>If you didn't create an account with Ocean App, please ignore this email.</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  emailVerified: (userName) => ({
    subject: "Email Verified Successfully - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Hello ${userName}!</h2>
        <p>🎉 Congratulations! Your email has been verified successfully.</p>
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #155724;">Your account is now active!</h3>
          <p>You can now:</p>
          <ul>
            <li>Browse and purchase products</li>
            <li>Create posts and listings</li>
            <li>Connect with other users</li>
            <li>Access all Ocean App features</li>
          </ul>
        </div>
        <p>Welcome to the Ocean App community!</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  passwordReset: (userName, resetLink) => ({
    subject: "Reset Your Password - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Hello ${userName}!</h2>
        <p>You requested to reset your password for your Ocean App account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #e74c3c; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #7f8c8d;">${resetLink}</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50;">Security Information:</h3>
          <ul>
            <li>This link will expire in 1 hour</li>
            <li>Only use this link once</li>
            <li>If you didn't request this, ignore this email</li>
          </ul>
        </div>
        <p>If you didn't request a password reset, please contact our support team immediately.</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
}; 