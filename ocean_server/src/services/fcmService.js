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
 * Map backend type/category to frontend category (social, marketplace, system).
 */
const mapToFrontendCategory = (type, category) => {
  const socialTypes = ['follow', 'post_like', 'post_comment', 'post_share', 'like', 'share', 'engagement'];
  const marketplaceTypes = ['product', 'product_like', 'buyer_need', 'swap', 'swap_proposal', 'swap_created', 'swap_accepted', 'swap_rejected', 'auction', 'group_buy', 'seller_application', 'item_saved', 'distress_sale', 'buyer_need_matched'];
  const t = (type || '').toLowerCase();
  if (socialTypes.includes(t) || category === 'follow') return 'social';
  if (marketplaceTypes.includes(t) || ['seller_application', 'buyer_need', 'swap', 'group_buy'].includes(category)) return 'marketplace';
  return 'system';
};

/**
 * Build navigation path from type and entityId.
 */
const buildNavigationPath = (type, entityId) => {
  if (!entityId) return '';
  const t = (type || '').toLowerCase();
  if (t.includes('post')) return `/posts/${entityId}`;
  if (t.includes('product')) return `/products/${entityId}`;
  if (t.includes('auction')) return `/auctions/${entityId}`;
  if (t.includes('group_buy')) return `/group-buys/${entityId}`;
  if (t.includes('swap')) return `/swap-deals/${entityId}`;
  if (t.includes('buyer_need')) return `/buyer-needs/${entityId}`;
  if (t === 'message' || t.includes('chat') || t.includes('dm')) return `/chat/${entityId}`;
  return '';
};

/**
 * Send push notification to all of a user's active devices.
 * Uses unified FCM data format for frontend consistency.
 * @param {string} userId
 * @param {{ title: string, body: string }} notification
 * @param {object} data - Metadata (type, relatedEntityId, senderId, commentId, notificationId, createdAt, etc.)
 * @returns {Promise<{firebaseInitialized: boolean, tokensFound: number, sentCount: number, failedCount: number, message: string}>}
 */
const sendPushNotification = async (userId, notification, data = {}) => {
  if (!initializeFirebase()) {
    return { firebaseInitialized: false, tokensFound: 0, sentCount: 0, failedCount: 0, message: 'Firebase not initialized - check FCM env vars' };
  }

  const tokens = await getFCMTokensForUser(userId);
  if (!tokens.length) {
    return { firebaseInitialized: true, tokensFound: 0, sentCount: 0, failedCount: 0, message: 'No FCM tokens found for user - user must open app to register token' };
  }

  const type = data.type || '';
  const entityId = data.relatedEntityId || data.entityId || data.postId || data.productId || data.auctionId || data.groupBuyId || data.swapDealId || data.buyerNeedId || '';
  const frontendCategory = mapToFrontendCategory(type, data.category);

  const unifiedData = {
    notificationId: data.notificationId || '',
    type,
    category: frontendCategory,
    title: notification.title || 'Notification',
    body: notification.body || '',
    createdAt: data.createdAt || new Date().toISOString(),
    navigationPath: data.navigationPath || buildNavigationPath(type, entityId),
    entityId,
    commentId: data.commentId || '',
    imageUrl: data.imageUrl || '',
    senderId: data.senderId || '',
    relatedEntityId: data.relatedEntityId || entityId
  };

  const payload = {
    priority: 'high',
    notification: {
      title: notification.title || 'Notification',
      body: notification.body || ''
    },
    data: stringifyData({ ...unifiedData, ...data }),
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

  let sentCount = 0;
  let failedCount = 0;

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      sentCount++;
    } else {
      failedCount++;
      const err = result.reason || {};
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

  const message = failedCount === 0
    ? `Push sent to ${sentCount} device(s)`
    : `Push sent to ${sentCount} device(s), ${failedCount} failed`;

  return { firebaseInitialized: true, tokensFound: tokens.length, sentCount, failedCount, message };
};

module.exports = {
  initializeFirebase,
  getFCMTokensForUser,
  markTokenInactive,
  sendPushNotification
};
