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
        },
        // Add timeout and connection settings
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,     // 60 seconds
        // Add pool settings for better connection management
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 14 // max 14 emails per second
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
    } else if (
      process.env.EMAIL_SERVICE === 'brevo' &&
      (process.env.BREVO_SMTP_USER || process.env.EMAIL_USER) &&
      (process.env.BREVO_SMTP_PASS || process.env.EMAIL_PASS)
    ) {
      // Use Brevo (Sendinblue) via SMTP relay
      const nodemailer = require('nodemailer');

      const brevoHost = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
      const brevoPort = parseInt(process.env.BREVO_SMTP_PORT || '465', 10); // Try 465 first
      const useSecure = brevoPort === 465;

      // Get credentials with fallback
      const brevoUser = process.env.BREVO_SMTP_USER || process.env.EMAIL_USER;
      const brevoPass = process.env.BREVO_SMTP_PASS || process.env.EMAIL_PASS;

      console.log('🔧 Brevo SMTP Configuration:');
      console.log(`Host: ${brevoHost}`);
      console.log(`Port: ${brevoPort}`);
      console.log(`User: ${brevoUser}`);
      console.log(`Pass: ${brevoPass ? '***SET***' : 'NOT SET'}`);

      const transporter = nodemailer.createTransport({
        host: brevoHost,
        port: brevoPort,
        secure: useSecure,
        auth: {
          user: brevoUser,
          pass: brevoPass
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        pool: true,
        maxConnections: 5,
        maxMessages: 100
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_USER || process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: message
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via Brevo SMTP:', to);
      return true;
    } else if (
      process.env.EMAIL_SERVICE === 'brevo-api' &&
      process.env.BREVO_API_KEY
    ) {
      // Use Brevo API (HTTP) instead of SMTP
      const axios = require('axios');
      
      const brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';
      const brevoApiKey = process.env.BREVO_API_KEY;
      
      console.log('🔧 Brevo API Configuration:');
      console.log(`API URL: ${brevoApiUrl}`);
      console.log(`API Key: ${brevoApiKey ? '***SET***' : 'NOT SET'}`);
      
      const emailData = {
        sender: {
          email: process.env.BREVO_FROM_EMAIL || process.env.FROM_EMAIL,
          name: 'Ocean App'
        },
        to: [
          {
            email: to,
            name: 'User'
          }
        ],
        subject: subject,
        htmlContent: message
      };
      
      const response = await axios.post(brevoApiUrl, emailData, {
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        }
      });
      
      console.log('✅ Email sent successfully via Brevo API:', to);
      return true;
    } else {
      // Fallback to console logging for development
      console.log('📧 EMAIL SERVICE - Sending email:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log(`Type: ${type}`);
      console.log('---');
      console.log('⚠️  Email service not configured. Add EMAIL_SERVICE and provider credentials to .env');
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
    
    // Additional debugging for Brevo
    if (process.env.EMAIL_SERVICE === 'brevo') {
      console.log('🔍 Brevo Debug Info:');
      console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE}`);
      console.log(`BREVO_SMTP_USER: ${process.env.BREVO_SMTP_USER || 'NOT SET'}`);
      console.log(`BREVO_SMTP_PASS: ${process.env.BREVO_SMTP_PASS ? 'SET' : 'NOT SET'}`);
      console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
      console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'SET' : 'NOT SET'}`);
    }
    
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
        <p><strong>Note:</strong> This link will expire in 15 minutes for security reasons.</p>
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

  passwordReset: (userName, resetCode) => ({
    subject: "Reset Your Password - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Hello ${userName}!</h2>
        <p>You requested to reset your password for your Ocean App account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; border: 2px solid #e74c3c;">
            <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Your Reset Code</h3>
            <div style="font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px; margin: 15px 0;">
              ${resetCode}
            </div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Enter this code in the app to reset your password</p>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50;">Security Information:</h3>
          <ul>
            <li>This code will expire in 10 minutes</li>
            <li>Only use this code once</li>
            <li>Never share this code with anyone</li>
            <li>If you didn't request this, ignore this email</li>
          </ul>
        </div>
        <p><strong>Important:</strong> If you didn't request a password reset, please contact our support team immediately.</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  // Subscription Email Templates
  subscriptionCreated: (userName, planName, price, currency, expiresAt) => ({
    subject: `🎉 Subscription Activated - ${planName} Plan - Ocean App`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Hello ${userName}!</h2>
        <p>🎉 Congratulations! Your subscription has been successfully activated.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #155724;">Subscription Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Plan:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${planName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${currency} ${price}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Expires:</strong></td>
              <td style="padding: 8px;">${new Date(expiresAt).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc;">What's Next?</h3>
          <p>You now have access to premium seller features:</p>
          <ul>
            <li>✅ Create product listings</li>
            <li>✅ Start group buys</li>
            <li>✅ Launch auctions</li>
            <li>✅ Use promotional boosts</li>
            <li>✅ Access analytics dashboard</li>
          </ul>
        </div>

        <p>Thank you for choosing Ocean App for your business needs!</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  subscriptionChanged: (userName, oldPlanName, newPlanName, price, currency, expiresAt) => ({
    subject: `📈 Subscription Updated - ${newPlanName} Plan - Ocean App`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Hello ${userName}!</h2>
        <p>📈 Your subscription plan has been successfully updated.</p>
        
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc;">Plan Change Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Previous Plan:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${oldPlanName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>New Plan:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${newPlanName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${currency} ${price}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Expires:</strong></td>
              <td style="padding: 8px;">${new Date(expiresAt).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #155724;">New Features Available</h3>
          <p>Your updated plan includes:</p>
          <ul>
            <li>✅ Enhanced listing limits</li>
            <li>✅ Advanced promotional tools</li>
            <li>✅ Priority customer support</li>
            <li>✅ Detailed analytics</li>
            <li>✅ Custom branding options</li>
          </ul>
        </div>

        <p>Thank you for upgrading your Ocean App experience!</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  subscriptionCancelled: (userName, planName, reason, expiresAt) => ({
    subject: `📋 Subscription Cancelled - Ocean App`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e67e22;">Hello ${userName}!</h2>
        <p>📋 Your subscription has been cancelled as requested.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #856404;">Cancellation Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Cancelled Plan:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${planName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Reason:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reason || 'No reason provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Access Until:</strong></td>
              <td style="padding: 8px;">${new Date(expiresAt).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057;">What Happens Next?</h3>
          <ul>
            <li>📅 You'll retain access until ${new Date(expiresAt).toLocaleDateString()}</li>
            <li>🔄 You can resubscribe anytime</li>
            <li>📞 Contact support if you need assistance</li>
            <li>💡 Consider our free plan for basic features</li>
          </ul>
        </div>

        <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  subscriptionExpiringReminder: (userName, planName, expiresAt) => ({
    subject: `⏰ Your ${planName} Plan Expires in 3 Days - Ocean App`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Hello ${userName}!</h2>
        <p>⏰ This is a friendly reminder that your <strong>${planName}</strong> subscription will expire in <strong>3 days</strong>.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #856404;">Subscription Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Current Plan:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${planName}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Expires On:</strong></td>
              <td style="padding: 8px;">${new Date(expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc;">Renew Now to Keep Your Premium Features</h3>
          <p>Don't lose access to these valuable features:</p>
          <ul>
            <li>🚀 Unlimited product listings</li>
            <li>📈 Advanced analytics and insights</li>
            <li>🎯 Promotional boosts and top placements</li>
            <li>👀 Access to Buyer Needs</li>
            <li>⚡ Priority customer support</li>
          </ul>
          <p style="background-color: #e7f3ff; padding: 16px; border-radius: 5px; margin: 20px 0;">
            <strong>To renew:</strong> Open the Ocean App → go to <strong>Settings</strong> → <strong>Subscription</strong> and renew your plan there.
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            💡 <strong>Tip:</strong> Renew before expiration to ensure uninterrupted access to all premium features.
          </p>
        </div>

        <p>Thank you for being a valued Ocean App user!</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  subscriptionExpired: (userName, planName) => ({
    subject: `⏰ Subscription Expired - Ocean App`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Hello ${userName}!</h2>
        <p>⏰ Your ${planName} subscription has expired.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #721c24;">Subscription Status</h3>
          <p>Your premium features are no longer available. You're now on our free plan.</p>
        </div>

        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc;">Renew Your Subscription</h3>
          <p>Don't miss out on premium features:</p>
          <ul>
            <li>🚀 Unlimited product listings</li>
            <li>📈 Advanced analytics</li>
            <li>🎯 Promotional boosts</li>
            <li>⚡ Priority support</li>
          </ul>
          <p style="background-color: #e7f3ff; padding: 16px; border-radius: 5px; margin: 20px 0;">
            <strong>To renew:</strong> Open the Ocean App → go to <strong>Settings</strong> → <strong>Subscription</strong> and renew your plan there.
          </p>
        </div>

        <p>Thank you for being a valued Ocean App user!</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  paymentFailed: (userName, planName, reason) => ({
    subject: `💳 Payment Failed - Ocean App`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Hello ${userName}!</h2>
        <p>💳 We encountered an issue processing your payment for the ${planName} plan.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #721c24;">Payment Issue</h3>
          <p><strong>Reason:</strong> ${reason || 'Payment could not be processed'}</p>
        </div>

        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc;">Next Steps</h3>
          <ul>
            <li>🔍 Check your payment method</li>
            <li>💳 Update your card details if needed</li>
            <li>🔄 Try the payment again</li>
            <li>📞 Contact support if issues persist</li>
          </ul>
          <p style="background-color: #e7f3ff; padding: 16px; border-radius: 5px; margin: 20px 0;">
            <strong>To retry payment:</strong> Open the Ocean App → go to <strong>Settings</strong> → <strong>Subscription</strong> and try again there.
          </p>
        </div>

        <p>Don't worry, your account remains active. Please try again to complete your subscription.</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  accountDeletionMagicLink: (userName, confirmUrl) => ({
    subject: "Delete Your Account - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 24px;">
        <h2 style="color: #fff;">Hello ${userName},</h2>
        <p style="color: #b0b0b0;">You requested to delete your Ocean App account. Click the button below to confirm and complete the deletion.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmUrl}" 
             style="background-color: #7c3aed; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; font-size: 16px; display: inline-block;">
            Confirm Account Deletion
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #7c3aed; font-size: 12px;">${confirmUrl}</p>
        <p style="color: #888; font-size: 13px; margin-top: 24px;"><strong>This link expires in 15 minutes.</strong> If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 12px;">Best regards,<br>The Ocean App Team</p>
      </div>
    `
  }),

  accountDeleted: (userName, deletionDate) => ({
    subject: "Account Deletion Confirmation - Ocean App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Hello ${userName},</h2>
        <p>This email confirms that your Ocean App account has been successfully deleted on ${deletionDate}.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50;">What was deleted:</h3>
          <ul>
            <li>Your personal information has been anonymized</li>
            <li>Your profile and account data</li>
            <li>Your active listings and posts</li>
            <li>Your saved items and preferences</li>
          </ul>
        </div>
        <p>If you did not request this deletion, please contact our support team immediately.</p>
        <p>We're sorry to see you go. If you change your mind, you're always welcome back!</p>
        <p>Best regards,<br>The Ocean App Team</p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
}; 