const fcmService = require('../services/fcmService');

/**
 * Internal endpoint: send push notification.
 * Called by message server when a DM is sent.
 * Requires Authorization: Bearer <INTERNAL_API_TOKEN> (shared with message server).
 */
const sendPush = async (req, res) => {
  try {
    const { userId, title, body, data = {} } = req.body;

    if (!userId || !title) {
      return res.status(400).json({
        success: false,
        message: 'userId and title are required'
      });
    }

    const result = await fcmService.sendPushNotification(
      userId,
      { title, body: body || title },
      data
    );

    const success = result.sentCount > 0;
    res.status(200).json({
      success,
      firebaseInitialized: result.firebaseInitialized,
      tokensFound: result.tokensFound,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      message: result.message
    });
  } catch (error) {
    console.error('Internal sendPush error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send push',
      error: error.message
    });
  }
};

module.exports = { sendPush };
