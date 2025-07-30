// Email service for notifications
// This is a placeholder service that can be integrated with your preferred email provider

const sendEmail = async (to, subject, message, type = 'info') => {
  try {
    // For development, just log the email
    console.log('📧 EMAIL SERVICE - Sending email:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`Type: ${type}`);
    console.log('---');

    // TODO: Integrate with your email service
    // Example with Nodemailer:
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: message
    };

    await transporter.sendMail(mailOptions);
    */

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
  })
};

module.exports = {
  sendEmail,
  emailTemplates
}; 