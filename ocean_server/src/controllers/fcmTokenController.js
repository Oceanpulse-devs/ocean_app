const db = require('../../models');

/**
 * Register or update FCM token for the current user.
 * POST /api/fcm-token
 * Body: { token: string, platform: 'android'|'ios'|'web', deviceId?: string }
 */
const registerFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, platform, deviceId } = req.body;

    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        message: 'token and platform are required'
      });
    }

    const allowed = ['android', 'ios', 'web'];
    if (!allowed.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'platform must be android, ios, or web'
      });
    }

    // Use deviceId or fallback so unique (user_id, device_id) works
    const resolvedDeviceId = deviceId || `token_${token.slice(0, 50)}`;

    const [record] = await db.UserFcmToken.findOrCreate({
      where: { userId, deviceId: resolvedDeviceId },
      defaults: {
        userId,
        token,
        platform,
        deviceId: resolvedDeviceId,
        isActive: true
      }
    });

    if (record.token !== token || record.platform !== platform || !record.isActive) {
      await record.update({ token, platform, isActive: true });
    }

    return res.status(200).json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error) {
    console.error('Register FCM token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register FCM token',
      error: error.message
    });
  }
};

/**
 * Unregister FCM token(s) for the current user.
 * DELETE /api/fcm-token
 * Query: ?deviceId=... (optional). If omitted, deactivate all tokens for user.
 */
const unregisterFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.query;

    const where = { userId };
    if (deviceId) where.deviceId = deviceId;

    const updated = await db.UserFcmToken.update(
      { isActive: false },
      { where }
    );

    return res.status(200).json({
      success: true,
      message: deviceId ? 'FCM token unregistered' : 'All FCM tokens unregistered'
    });
  } catch (error) {
    console.error('Unregister FCM token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unregister FCM token',
      error: error.message
    });
  }
};

module.exports = {
  registerFcmToken,
  unregisterFcmToken
};
