/**
 * Standalone Push Notification Diagnostic & Trigger Script
 * 
 * Usage on VPS / Terminal:
 *   node scripts/test_push.js <email_or_user_id_or_username>
 * 
 * Or with custom title and body:
 *   node scripts/test_push.js <email_or_user_id> --title "New shoes in stock!" --body "Check out new listings today."
 * 
 * Or test with an explicit raw FCM token:
 *   node scripts/test_push.js --token <raw_fcm_token>
 * 
 * Or run with no arguments to test Firebase credentials and view the latest active device tokens:
 *   node scripts/test_push.js
 */

require('dotenv').config();
const { Op } = require('sequelize');
const db = require('../models');
const fcmService = require('../src/services/fcmService');

// Default genuine-looking market notification
const DEFAULT_TITLE = 'Market Activity Update 📈';
const DEFAULT_BODY = 'Buyers are active in your area today! Post a product or explore trending deals now.';

function parseArgs(args) {
  let title = DEFAULT_TITLE;
  let body = DEFAULT_BODY;
  let userQuery = null;
  let rawToken = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      title = args[++i];
    } else if (args[i] === '--body' && args[i + 1]) {
      body = args[++i];
    } else if (args[i] === '--token' && args[i + 1]) {
      rawToken = args[++i];
    } else if (!args[i].startsWith('--') && !userQuery) {
      userQuery = args[i];
    }
  }

  return { title, body, userQuery, rawToken };
}

async function run() {
  console.log('====================================================');
  console.log('🔔 Ocean Server FCM Push Notification Dispatcher');
  console.log('====================================================\n');

  // 1. Verify Environment Variables
  console.log('1. Checking Firebase Environment Variables...');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log(`   - FIREBASE_PROJECT_ID:   ${projectId || '❌ MISSING'}`);
  console.log(`   - FIREBASE_CLIENT_EMAIL: ${clientEmail || '❌ MISSING'}`);
  console.log(`   - FIREBASE_PRIVATE_KEY:  ${privateKey ? `Present (${privateKey.length} chars)` : '❌ MISSING'}`);

  if (!projectId || !clientEmail || !privateKey) {
    console.error('\n❌ Missing required Firebase environment variables. Exiting.');
    process.exit(1);
  }

  // 2. Initialize Firebase
  console.log('\n2. Initializing Firebase Admin SDK...');
  const initialized = fcmService.initializeFirebase();
  if (!initialized) {
    console.error('\n❌ Firebase initialization failed. Please check your credentials / Base64 private key.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const { title, body, userQuery, rawToken } = parseArgs(args);

  // Raw token mode: node scripts/test_push.js --token <raw_token>
  if (rawToken) {
    console.log(`\n3. Sending direct push to provided FCM token: ${rawToken.slice(0, 20)}...`);
    console.log(`   Title: "${title}"`);
    console.log(`   Body:  "${body}"`);
    try {
      const admin = require('firebase-admin');
      const response = await admin.messaging().send({
        token: rawToken,
        notification: { title, body },
        data: {
          type: 'product',
          category: 'marketplace',
          navigationPath: '/marketplace',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      });
      console.log('\n✅ Push sent successfully to device!');
      console.log('Firebase Response ID:', response);
    } catch (err) {
      console.error('\n❌ Failed to send push to token:', err.code || err.message);
      if (err.message) console.error(err.message);
    }
    process.exit(0);
  }

  // If no user argument provided, list latest registered tokens in DB
  if (!userQuery) {
    console.log('\n3. No user ID/email specified. Querying latest active device tokens in database...');
    try {
      const recentTokens = await db.UserFcmToken.findAll({
        where: { isActive: true },
        limit: 5,
        order: [['updatedAt', 'DESC']],
        include: [{ model: db.UserTable, as: 'user', attributes: ['id', 'email', 'username', 'fullName'] }],
        raw: false
      });

      if (!recentTokens.length) {
        console.log('\n⚠️ No active device tokens found in `user_fcm_tokens` table.');
        console.log('   Users must log in to the mobile app so the app registers their FCM token via POST /api/fcm-token.');
      } else {
        console.log(`\nFound ${recentTokens.length} recent active device token(s):`);
        recentTokens.forEach((t, i) => {
          const u = t.user || {};
          console.log(`   [${i + 1}] User: ${u.email || u.username || t.userId} (${t.platform}) | Device: ${t.deviceId || 'N/A'}`);
          console.log(`       Token: ${t.token ? t.token.slice(0, 35) + '...' : 'none'}`);
        });
        console.log('\n💡 To send a push to a specific user, run:');
        console.log('   node scripts/test_push.js <email_or_username_or_userId>\n');
        
        // Send to the most recent user
        const targetToken = recentTokens[0];
        const targetUser = targetToken.user || { id: targetToken.userId };
        console.log(`🚀 Dispatching market update push to most recent user: ${targetUser.email || targetToken.userId}...`);
        
        const result = await fcmService.sendPushNotification(targetToken.userId, {
          title,
          body
        }, {
          type: 'product',
          category: 'marketplace',
          navigationPath: '/marketplace',
          notificationId: 'notif-' + Date.now()
        });

        console.log('\nResult:', result);
      }
    } catch (dbErr) {
      console.error('\n❌ Database query failed:', dbErr.message);
    }
    process.exit(0);
  }

  // 4. Find user by ID, email, or username
  console.log(`\n3. Looking up user matching: "${userQuery}"...`);
  try {
    const user = await db.UserTable.findOne({
      where: {
        [Op.or]: [
          { id: userQuery },
          { email: userQuery },
          { username: userQuery }
        ]
      }
    });

    if (!user) {
      console.error(`❌ User not found for query: "${userQuery}". Please verify the email, username, or UUID.`);
      process.exit(1);
    }

    console.log(`   User found: ${user.fullName || user.username} (${user.email}) | ID: ${user.id}`);
    console.log(`   Notification: "${title}" - "${body}"`);

    // 5. Send push notification
    console.log('\n4. Dispatching push notification via fcmService...');
    const result = await fcmService.sendPushNotification(user.id, {
      title,
      body
    }, {
      type: 'product',
      category: 'marketplace',
      navigationPath: '/marketplace',
      notificationId: 'notif-' + Date.now()
    });

    console.log('\n====================================================');
    console.log('Result Summary:');
    console.log('====================================================');
    console.log(`   - Firebase Initialized: ${result.firebaseInitialized}`);
    console.log(`   - Active Tokens Found:  ${result.tokensFound}`);
    console.log(`   - Sent Count:           ${result.sentCount}`);
    console.log(`   - Failed Count:         ${result.failedCount}`);
    console.log(`   - Status Message:       ${result.message}`);

    if (result.tokensFound === 0) {
      console.log('\n⚠️ No tokens were found for this user in `user_fcm_tokens`.');
      console.log('   The user must open/log into the mobile app so the app registers their FCM token via POST /api/fcm-token.');
    } else if (result.sentCount > 0) {
      console.log('\n🎉 SUCCESS! Push notification was dispatched to Google FCM.');
      console.log('   Check the user’s mobile device screen / notification tray!');
    }
  } catch (err) {
    console.error('\n❌ Unexpected error running test push:', err);
  }

  process.exit(0);
}

run();
