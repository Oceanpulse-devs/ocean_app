const db = require('../../models');
const {
  UserTable,
  SellersTable,
  Product,
  Post,
  Auction,
  GroupBuy,
  SwapDeal,
  BuyerNeed,
  UserFollows,
  SavedItem,
  PostLike,
  ProductLike,
  Notification
} = db;
const crypto = require('crypto');
const redisClient = require('../config/redisdb');
const { sendEmail, emailTemplates } = require('../services/emailService');

const TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const REDIS_PREFIX = 'delete_account:';

// Shared styling: black, white, a little purple
const pageStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #000;
    color: #fff;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .container {
    background: #111;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 32px;
    max-width: 440px;
    width: 100%;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  }
  h1 { font-size: 1.5rem; margin-bottom: 8px; color: #fff; }
  h2 { font-size: 1.25rem; margin-bottom: 16px; color: #e0e0e0; }
  p { color: #b0b0b0; line-height: 1.6; margin-bottom: 16px; font-size: 14px; }
  ul { color: #b0b0b0; margin-left: 20px; margin-bottom: 24px; font-size: 14px; line-height: 1.8; }
  label { display: block; color: #e0e0e0; margin-bottom: 8px; font-size: 14px; }
  input[type="email"] {
    width: 100%;
    padding: 12px 16px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    color: #fff;
    font-size: 16px;
    margin-bottom: 20px;
  }
  input[type="email"]:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3);
  }
  button {
    width: 100%;
    padding: 14px 20px;
    background: #7c3aed;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  button:hover { background: #6d28d9; }
  .success { color: #a5f3a5; }
  .error { color: #fca5a5; margin-bottom: 16px; }
  .note { font-size: 13px; color: #888; margin-top: 20px; }
  a { color: #a78bfa; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .brand-header { text-align: center; margin-bottom: 24px; }
  .brand-header img { width: 72px; height: 72px; border-radius: 8px; object-fit: contain; }
  .brand-header .brand-name { font-size: 1.25rem; color: #e0e0e0; margin-top: 8px; }
`;

/**
 * GET /delete-account - Form page
 */
const getDeleteAccountForm = (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delete Account - Ocean App</title>
  <style>${pageStyles}</style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <img src="/public/oceanLogo.jpeg" alt="Ocean App" />
      <div class="brand-name">Ocean App</div>
    </div>
    <h1>Delete Your Account</h1>
    <p>
      This will permanently delete your account information such as email, profile data, and personal details.
      Some content (products, posts) may remain in anonymized form for marketplace integrity.
    </p>
    <ul>
      <li>Personal information will be permanently anonymized</li>
      <li>Your profile and account data will be removed</li>
      <li>Products and posts will be deactivated</li>
      <li>This action cannot be undone</li>
    </ul>
    <form method="POST" action="/delete-account/request">
      <label for="email">Enter your account email</label>
      <input type="email" id="email" name="email" placeholder="you@example.com" required autocomplete="email" />
      <button type="submit">Send Deletion Link</button>
    </form>
    <p class="note">
      We will send a secure link to your email. Click it within 15 minutes to complete the deletion.
    </p>
  </div>
</body>
</html>`;
  res.send(html);
};

/**
 * POST /delete-account/request - Send magic link to email
 */
const postDeleteAccountRequest = async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).send(renderErrorPage('Please enter your email address.'));
  }

  try {
    const user = await UserTable.findOne({
      where: { email },
      attributes: ['id', 'email', 'fullName', 'accountStatus']
    });

    if (!user) {
      // Don't reveal whether account exists - show same success message
      return res.send(renderCheckEmailPage());
    }

    if (user.accountStatus === 'deactivated') {
      return res.send(renderCheckEmailPage());
    }

    const token = crypto.randomBytes(32).toString('hex');
    const redisKey = `${REDIS_PREFIX}${token}`;
    await redisClient.setEx(redisKey, TOKEN_EXPIRY_SECONDS, user.id);

    const baseUrl = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
    const confirmUrl = `${baseUrl}/delete-account/confirm?token=${token}`;

    const template = emailTemplates.accountDeletionMagicLink(user.fullName || 'User', confirmUrl);
    await sendEmail(user.email, template.subject, template.html, 'account-deletion');

    return res.send(renderCheckEmailPage());
  } catch (error) {
    console.error('Delete account request error:', error);
    return res.status(500).send(renderErrorPage('Something went wrong. Please try again later.'));
  }
};

/**
 * GET /delete-account/confirm?token=xxx - Verify token and delete
 */
const getDeleteAccountConfirm = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send(renderErrorPage('Invalid or missing link. Please request a new deletion link.'));
  }

  try {
    const redisKey = `${REDIS_PREFIX}${token}`;
    const userId = await redisClient.get(redisKey);
    if (!userId) {
      return res.status(400).send(renderErrorPage('This link has expired or already been used. Please request a new deletion link.'));
    }

    await redisClient.del(redisKey);

    const user = await UserTable.findByPk(userId);
    if (!user || user.accountStatus === 'deactivated') {
      return res.send(renderSuccessPage('Your account has already been deleted or does not exist.'));
    }

    const { performAccountDeletion } = require('./authcontroller');
    await performAccountDeletion(userId, 'User requested deletion via web form');

    return res.send(renderSuccessPage('Your account has been successfully deleted. All your personal information has been anonymized.'));
  } catch (error) {
    console.error('Delete account confirm error:', error);
    return res.status(500).send(renderErrorPage('Something went wrong. Please try again or contact support.'));
  }
};

function renderCheckEmailPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check Your Email - Ocean App</title>
  <style>${pageStyles}</style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <img src="/public/oceanLogo.jpeg" alt="Ocean App" />
      <div class="brand-name">Ocean App</div>
    </div>
    <h1>Check Your Email</h1>
    <p class="success">
      If an account exists with that email, we've sent you a secure link to delete your account.
      The link expires in 15 minutes.
    </p>
    <p>Please check your inbox (and spam folder) and click the link to complete the deletion.</p>
    <p class="note"><a href="/delete-account">Request another link</a></p>
  </div>
</body>
</html>`;
}

function renderSuccessPage(message) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted - Ocean App</title>
  <style>${pageStyles}</style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <img src="/public/oceanLogo.jpeg" alt="Ocean App" />
      <div class="brand-name">Ocean App</div>
    </div>
    <h1>Account Deleted</h1>
    <p class="success">${message}</p>
    <p>Thank you for using Ocean App.</p>
  </div>
</body>
</html>`;
}

function renderErrorPage(message) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Ocean App</title>
  <style>${pageStyles}</style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <img src="/public/oceanLogo.jpeg" alt="Ocean App" />
      <div class="brand-name">Ocean App</div>
    </div>
    <h1>Unable to Complete</h1>
    <p class="error">${message}</p>
    <p><a href="/delete-account">Try again</a></p>
  </div>
</body>
</html>`;
}

module.exports = {
  getDeleteAccountForm,
  postDeleteAccountRequest,
  getDeleteAccountConfirm
};
