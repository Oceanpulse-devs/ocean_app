# 📧 Email Setup Guide for Ocean App

## 🚀 Quick Setup with Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select **Other** as the device
4. Enter "Ocean App" as the device name
5. Click **Generate**
6. **Copy the 16-character password** (save it securely!)

### Step 3: Update Environment Variables
Add these to your `ocean_server/.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
FROM_EMAIL=your-gmail@gmail.com
FRONTEND_URL=http://localhost:3000
```

### Step 4: Test Email Sending
1. Restart your server: `npm start`
2. Try signing up a new user
3. Check your email for verification link

## 🔧 Alternative: Brevo (Sendinblue) via SMTP

### Step 1: Create Brevo Account
1. Go to `https://www.brevo.com/`
2. Create an account and verify your sender domain or email

### Step 2: Get SMTP Credentials
1. Go to Dashboard → SMTP & API
2. Copy SMTP user (usually your email) and SMTP key (password)

### Step 3: Update Environment Variables
```env
EMAIL_SERVICE=brevo
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-smtp-user
BREVO_SMTP_PASS=your-brevo-smtp-key
BREVO_FROM_EMAIL=your-verified@domain.com
FRONTEND_URL=http://localhost:3000
```

### Notes
- Use port 587 (STARTTLS) on most hosts; use 465 with `BREVO_SMTP_PORT=465` if SSL is required
- Make sure `BREVO_FROM_EMAIL` is a verified sender in Brevo

## 🔧 Alternative: SendGrid (Professional)

### Step 1: Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/)
2. Create free account (100 emails/day free)
3. Verify your sender identity

### Step 2: Get API Key
1. Go to **Settings** → **API Keys**
2. Create new API key
3. Copy the key

### Step 3: Update Environment Variables
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=your-verified-email@domain.com
FRONTEND_URL=http://localhost:3000
```

## 🎯 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_SERVICE` | Email provider | `gmail` or `sendgrid` |
| `EMAIL_USER` | Gmail address | `your-email@gmail.com` |
| `EMAIL_PASS` | Gmail App Password | `abcd efgh ijkl mnop` |
| `FROM_EMAIL` | Sender email | `your-email@gmail.com` |
| `FRONTEND_URL` | Your app URL | `http://localhost:3000` |

## 🚨 Important Notes

### Gmail App Password:
- **Never use your regular Gmail password**
- **Use the 16-character App Password**
- **Keep it secure and private**
- **Regenerate if compromised**

### Security:
- **Don't commit .env file to git**
- **Use different emails for development/production**
- **Monitor email sending limits**

## 🧪 Testing

### Test Signup Flow:
1. **Sign up** with a new email
2. **Check email** for verification link
3. **Click link** to verify
4. **Try logging in** (should work now)

### Test Resend:
1. **Try resending** verification email
2. **Check rate limiting** (max 5 per hour)
3. **Verify new token** works

## 🎉 Success Indicators

✅ **Console shows**: `Email sent successfully via Gmail: user@example.com`
✅ **Email received** in inbox
✅ **Verification link** works
✅ **User can login** after verification

## 🆘 Troubleshooting

### "Invalid login" error:
- Check if 2FA is enabled
- Verify App Password is correct
- Ensure no spaces in App Password

### "Email not received":
- Check spam folder
- Verify email address is correct
- Check Gmail sending limits

### "Rate limit exceeded":
- Wait 1 hour before trying again
- Check Redis rate limiting logs

## 📞 Support

If you need help:
1. Check console logs for errors
2. Verify environment variables
3. Test with a simple email first
4. Check Gmail/SendGrid status pages
