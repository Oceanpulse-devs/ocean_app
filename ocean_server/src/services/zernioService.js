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
   * Get or create a Zernio profile for a seller
   * POST /v1/profiles
   * @param {Object} seller - Seller object
   * @returns {Promise<string>} Zernio profileId
   */
  async getOrCreateProfile(seller) {
    try {
      const apiKey = this.apiKey ? this.apiKey.trim() : '';
      if (!apiKey) {
        throw new Error('ZERNIO_API_KEY is not configured in environment variables');
      }

      // Check if seller already has a profile stored in database
      const { SellerSocialAccount } = require('../../models');
      const existingAccount = await SellerSocialAccount.findOne({
        where: { sellerId: seller.id }
      });

      if (existingAccount && existingAccount.zernioProfileId) {
        console.log(`✅ Found existing Zernio profileId for seller ${seller.id}: ${existingAccount.zernioProfileId}`);
        return existingAccount.zernioProfileId;
      }

      // Profile name for Zernio
      const profileName = seller.businessName || seller.fullName || `Seller_${seller.id.substring(0, 8)}`;
      console.log(`📡 Creating Zernio Profile for seller ${seller.id} (Name: "${profileName}")...`);

      try {
        const response = await axios.post(
          `${this.baseUrl}/profiles`,
          { name: profileName },
          { headers: this.getHeaders(), timeout: 15000 }
        );

        console.log('✅ Zernio Profile Created:', response.data);
        const profileId = response.data?.id || response.data?.profileId || response.data?.data?.id;

        if (profileId) {
          return profileId;
        }
      } catch (postErr) {
        console.error('❌ POST /v1/profiles Error Details:', postErr.response?.data || postErr.message);

        // Fallback: Try fetching existing profiles from Zernio GET /v1/profiles
        try {
          console.log('Fetching profiles list from GET /v1/profiles...');
          const listResponse = await axios.get(
            `${this.baseUrl}/profiles`,
            { headers: this.getHeaders(), timeout: 15000 }
          );

          const profiles = listResponse.data?.profiles || listResponse.data?.data || listResponse.data || [];
          if (Array.isArray(profiles) && profiles.length > 0) {
            const matched = profiles.find(p => p.name === profileName) || profiles[0];
            const profileId = matched?.id || matched?.profileId;
            if (profileId) {
              console.log(`✅ Using existing Zernio Profile ID: ${profileId}`);
              return profileId;
            }
          }
        } catch (listErr) {
          console.error('❌ GET /v1/profiles Error Details:', listErr.response?.data || listErr.message);
        }

        throw postErr;
      }

      throw new Error('Failed to create or retrieve Zernio profile ID');
    } catch (error) {
      console.error('getOrCreateProfile Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate Zernio OAuth connection URL for seller
   * @param {Object|string} seller - Seller object or profileId
   * @param {string} platform - Target platform ('facebook', 'instagram', 'whatsapp')
   * @returns {Promise<Object>} Object with connectUrl and authUrl
   */
  async getConnectUrl(seller, platform) {
    try {
      const normalizedPlatform = (platform || 'facebook').toLowerCase().trim();
      const apiKey = this.apiKey ? this.apiKey.trim() : '';

      if (!apiKey) {
        throw new Error('ZERNIO_API_KEY is not configured in environment variables');
      }

      // Step 1: Get or create Zernio Profile ID (returned by POST /v1/profiles)
      let profileId;
      if (typeof seller === 'object' && seller.id) {
        profileId = await this.getOrCreateProfile(seller);
      } else {
        profileId = seller;
      }

      const redirectUrl = `${process.env.BACKEND_URL || 'https://bluewhalemarketplace.com'}/api/seller/social/callback`;

      console.log(`📡 Requesting Zernio connect URL: Platform=${normalizedPlatform}, ProfileId=${profileId}, RedirectUrl=${redirectUrl}`);

      // Step 2: Call GET /v1/connect/{platform} passing profileId & redirect_url
      let response;
      try {
        response = await axios.get(
          `${this.baseUrl}/connect/${normalizedPlatform}`,
          {
            headers: this.getHeaders(),
            params: {
              profileId: profileId,
              redirect_url: redirectUrl,
              redirectUri: redirectUrl,
              redirect_uri: redirectUrl
            },
            timeout: 15000
          }
        );
      } catch (getErr) {
        console.error(`❌ GET /v1/connect/${normalizedPlatform} Error Details:`, getErr.response?.data || getErr.message);
        console.warn(`Retrying with POST /v1/connect/${normalizedPlatform}...`);

        try {
          response = await axios.post(
            `${this.baseUrl}/connect/${normalizedPlatform}`,
            {
              profileId: profileId,
              redirect_url: redirectUrl,
              redirectUri: redirectUrl
            },
            {
              headers: this.getHeaders(),
              timeout: 15000
            }
          );
        } catch (postErr) {
          console.error(`❌ POST /v1/connect/${normalizedPlatform} Error Details:`, postErr.response?.data || postErr.message);
          throw postErr;
        }
      }

      console.log(`✅ Zernio Connect API Response:`, response.data);

      const authUrl = response.data?.authUrl || 
                      response.data?.url || 
                      response.data?.connectUrl || 
                      response.data?.data?.authUrl || 
                      response.data?.data?.url;

      if (!authUrl) {
        throw new Error(`Zernio response missing authUrl: ${JSON.stringify(response.data)}`);
      }

      return {
        success: true,
        connectUrl: authUrl,
        authUrl: authUrl,
        profileId: profileId
      };
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      console.error('Zernio getConnectUrl Error:', errorDetails);
      return {
        success: false,
        error: error.response?.data?.message || (typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails)
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
