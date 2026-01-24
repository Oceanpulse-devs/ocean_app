const admin = require('firebase-admin');
const db = require('../../models');

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK from env vars.
 * Uses FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL.
 */
const initializeFirebase = () => {
  if (firebaseInitialized) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn('FCM: Missing Firebase env vars (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL). Push disabled.');
    return false;
  }

  try {
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: formattedKey,
        clientEmail
      })
    });
    firebaseInitialized = true;
    console.log('FCM: Firebase Admin initialized');
    return true;
  } catch (err) {
    console.error('FCM: Firebase init failed', err.message);
    return false;
  }
};

/**
 * Get active FCM tokens for a user.
 * @param {string} userId
 * @returns {Promise<string[]>} Array of token strings
 */
const getFCMTokensForUser = async (userId) => {
  try {
    const rows = await db.UserFcmToken.findAll({
      where: { userId, isActive: true },
      attributes: ['token'],
      raw: true
    });
    return rows.map((r) => r.token).filter(Boolean);
  } catch (err) {
    console.error('FCM: getFCMTokensForUser error', err.message);
    return [];
  }
};

/**
 * Mark a token as inactive (e.g. after invalid-registration error).
 * @param {string} token
 */
const markTokenInactive = async (token) => {
  try {
    await db.UserFcmToken.update(
      { isActive: false },
      { where: { token } }
    );
    console.log('FCM: Marked token inactive');
  } catch (err) {
    console.error('FCM: markTokenInactive error', err.message);
  }
};

/**
 * Ensure all FCM data payload values are strings.
 * @param {object} data
 * @returns {object}
 */
const stringifyData = (data) => {
  if (!data || typeof data !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) {
      out[k] = '';
    } else if (typeof v === 'object') {
      out[k] = JSON.stringify(v);
    } else {
      out[k] = String(v);
    }
  }
  return out;
};

/**
 * Send push notification to all of a user's active devices.
 * @param {string} userId
 * @param {{ title: string, body: string }} notification
 * @param {object} data - Metadata (type, relatedEntityId, senderId, commentId, etc.). All values stringified.
 */
const sendPushNotification = async (userId, notification, data = {}) => {
  if (!initializeFirebase()) return;

  const tokens = await getFCMTokensForUser(userId);
  if (!tokens.length) {
    return;
  }

  const payload = {
    notification: {
      title: notification.title || 'Notification',
      body: notification.body || ''
    },
    data: stringifyData({
      type: data.type || '',
      relatedEntityId: data.relatedEntityId || '',
      senderId: data.senderId || '',
      commentId: data.commentId || '',
      ...data
    }),
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      },
      headers: { 'apns-priority': '10' }
    }
  };

  const results = await Promise.allSettled(
    tokens.map((token) => admin.messaging().send({ ...payload, token }))
  );

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason;
      const code = err?.code || err?.errorInfo?.code || '';
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-argument'
      ) {
        markTokenInactive(tokens[i]);
      }
      console.error('FCM: send error', code, err?.message || err);
    }
  });
};

module.exports = {
  initializeFirebase,
  getFCMTokensForUser,
  markTokenInactive,
  sendPushNotification
};
