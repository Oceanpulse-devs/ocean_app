const axios = require('axios');

class ZernioService {
  constructor() {
    this.apiKey = process.env.ZERNIO_API_KEY || '';
    this.baseUrl = process.env.ZERNIO_BASE_URL || 'https://api.zernio.com/v1';
  }

  /**
   * Get Zernio API request headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Generate Zernio OAuth connection URL for seller
   * @param {string} sellerId - Seller ID
   * @param {string} platform - Target platform ('facebook', 'instagram', 'whatsapp')
   * @returns {Promise<Object>} Object with connectUrl
   */
  async getConnectUrl(sellerId, platform) {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ ZERNIO_API_KEY not configured in .env. Returning simulated connect URL.');
        return {
          success: true,
          connectUrl: `https://zernio.com/oauth/connect?seller_id=${sellerId}&platform=${platform}&app_id=ocean_bluewhale`
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/oauth/connect-url`,
        {
          sellerId,
          platform,
          redirectUri: `${process.env.BACKEND_URL || 'https://bluewhalemarketplace.com'}/api/seller/social/callback`
        },
        { headers: this.getHeaders(), timeout: 15000 }
      );

      return {
        success: true,
        connectUrl: response.data.connectUrl || response.data.url
      };
    } catch (error) {
      console.error('Zernio getConnectUrl error:', error.response?.data || error.message);
      // Return fallback connection link
      return {
        success: true,
        connectUrl: `https://zernio.com/oauth/connect?seller_id=${sellerId}&platform=${platform}`
      };
    }
  }

  /**
   * Publish post to connected social profile via Zernio API
   * @param {string} zernioProfileId - Target Zernio profile/account ID
   * @param {Object} payload - { caption, mediaUrls, platform, link }
   * @returns {Promise<Object>} Publication result with zernioPostId
   */
  async publishPost(zernioProfileId, payload) {
    try {
      const { caption, mediaUrls = [], platform, link } = payload;

      if (!this.apiKey) {
        console.log(`[Zernio Simulated Publish] Platform: ${platform}, Profile: ${zernioProfileId}, Link: ${link}`);
        return {
          success: true,
          zernioPostId: `zernio_sim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'success'
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/posts/publish`,
        {
          profileId: zernioProfileId,
          platform,
          caption,
          mediaUrls,
          link
        },
        { headers: this.getHeaders(), timeout: 30000 }
      );

      if (response.data && (response.data.success || response.data.id)) {
        return {
          success: true,
          zernioPostId: response.data.id || response.data.postId || `zernio_${Date.now()}`,
          status: 'success'
        };
      } else {
        throw new Error(response.data?.message || 'Publication failed via Zernio');
      }
    } catch (error) {
      console.error(`Error publishing to Zernio (${payload.platform}):`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Check post status from Zernio
   * @param {string} zernioPostId - Zernio post reference ID
   */
  async getPostStatus(zernioPostId) {
    try {
      if (!this.apiKey || zernioPostId.startsWith('zernio_sim_')) {
        return { success: true, status: 'published' };
      }

      const response = await axios.get(
        `${this.baseUrl}/posts/${zernioPostId}`,
        { headers: this.getHeaders(), timeout: 10000 }
      );

      return {
        success: true,
        status: response.data.status || 'published'
      };
    } catch (error) {
      console.error('Error fetching Zernio post status:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ZernioService();
