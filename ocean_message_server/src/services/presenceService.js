const redisClient = require('../config/redis');

// In-memory registry of active grace-period disconnect timers
const disconnectTimers = new Map();

/**
 * Presence Service
 * Manages high-performance online/offline state and last-seen timestamps via Redis
 */
class PresenceService {
  /**
   * Mark a user as online upon socket connection
   * @param {string} userId 
   * @param {string} socketId 
   * @returns {Promise<{ userId: string, isOnline: boolean, lastSeen: string }>}
   */
  static async setUserOnline(userId, socketId) {
    if (!userId) return null;

    // Clear any pending disconnect grace timer if the user reconnected quickly
    if (disconnectTimers.has(userId)) {
      clearTimeout(disconnectTimers.get(userId));
      disconnectTimers.delete(userId);
    }

    const nowIso = new Date().toISOString();

    try {
      if (redisClient?.isReady) {
        await Promise.all([
          redisClient.sAdd(`user_connections:${userId}`, socketId),
          redisClient.hSet(`user_presence:${userId}`, {
            status: 'online',
            last_seen: nowIso
          })
        ]);
      }
    } catch (err) {
      console.error(`⚠️ Redis error in setUserOnline for user ${userId}:`, err?.message || err);
    }

    return {
      userId,
      isOnline: true,
      lastSeen: nowIso
    };
  }

  /**
   * Handle socket disconnect with a 15-second grace period for mobile app switching
   * @param {string} userId 
   * @param {string} socketId 
   * @param {Function} onConfirmedOffline - Callback fired if user stays disconnected after 15s
   */
  static async setUserOffline(userId, socketId, onConfirmedOffline) {
    if (!userId) return;

    try {
      if (redisClient?.isReady) {
        await redisClient.sRem(`user_connections:${userId}`, socketId);
        const remaining = await redisClient.sCard(`user_connections:${userId}`);

        if (remaining === 0) {
          // Clear any existing timer for this user
          if (disconnectTimers.has(userId)) {
            clearTimeout(disconnectTimers.get(userId));
          }

          // Start 15-second grace period
          const timer = setTimeout(async () => {
            disconnectTimers.delete(userId);

            try {
              if (redisClient?.isReady) {
                const finalCount = await redisClient.sCard(`user_connections:${userId}`);
                if (finalCount === 0) {
                  const lastSeenIso = new Date().toISOString();
                  await redisClient.hSet(`user_presence:${userId}`, {
                    status: 'offline',
                    last_seen: lastSeenIso
                  });

                  if (typeof onConfirmedOffline === 'function') {
                    onConfirmedOffline({
                      userId,
                      isOnline: false,
                      lastSeen: lastSeenIso
                    });
                  }
                }
              }
            } catch (innerErr) {
              console.error(`⚠️ Redis error finalizing offline status for ${userId}:`, innerErr?.message || innerErr);
            }
          }, 15000);

          disconnectTimers.set(userId, timer);
        }
      }
    } catch (err) {
      console.error(`⚠️ Redis error in setUserOffline for user ${userId}:`, err?.message || err);
    }
  }

  /**
   * Get single user presence from Redis
   * @param {string} userId 
   * @returns {Promise<{ isOnline: boolean, lastSeen: string | null }>}
   */
  static async getPresence(userId) {
    if (!userId) return { isOnline: false, lastSeen: null };

    try {
      if (redisClient?.isReady) {
        const data = await redisClient.hGetAll(`user_presence:${userId}`);
        if (data && Object.keys(data).length > 0) {
          return {
            isOnline: data.status === 'online',
            lastSeen: data.last_seen || null
          };
        }
      }
    } catch (err) {
      console.error(`⚠️ Error fetching presence for ${userId}:`, err?.message || err);
    }

    return { isOnline: false, lastSeen: null };
  }

  /**
   * Get batch presence for multiple user IDs
   * @param {string[]} userIds 
   * @returns {Promise<Record<string, { isOnline: boolean, lastSeen: string | null }>>}
   */
  static async getBatchPresence(userIds = []) {
    const result = {};
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return result;
    }

    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    uniqueIds.forEach(id => {
      result[id] = { isOnline: false, lastSeen: null };
    });

    if (!redisClient?.isReady) {
      return result;
    }

    try {
      // Fetch presence in parallel using Promise.all
      const presencePromises = uniqueIds.map(async (id) => {
        try {
          const data = await redisClient.hGetAll(`user_presence:${id}`);
          if (data && Object.keys(data).length > 0) {
            result[id] = {
              isOnline: data.status === 'online',
              lastSeen: data.last_seen || null
            };
          }
        } catch (fetchErr) {
          // Fallback retained
        }
      });

      await Promise.all(presencePromises);
    } catch (err) {
      console.error('⚠️ Error fetching batch presence from Redis:', err?.message || err);
    }

    return result;
  }
}

module.exports = PresenceService;
