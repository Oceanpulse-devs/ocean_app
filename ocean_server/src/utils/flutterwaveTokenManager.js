const axios = require('axios');

/**
 * Flutterwave OAuth Token Manager
 * 
 * Manages OAuth 2.0 access tokens for Flutterwave API authentication
 * Tokens expire in 10 minutes, so we refresh them at 9 minutes
 */
class FlutterwaveTokenManager {
  constructor() {
    this.tokenUrl = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';
    this.accessToken = null;
    this.expiresIn = 0; // Token expiry time in seconds
    this.lastTokenRefreshTime = 0;
    this.clientId = process.env.FLW_CLIENT_ID;
    this.clientSecret = process.env.FLW_CLIENT_SECRET;
  }

  /**
   * Generate a new access token from Flutterwave OAuth endpoint
   * @returns {Promise<string>} Access token
   */
  async refreshToken() {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Flutterwave credentials not configured. Please set FLW_CLIENT_ID and FLW_CLIENT_SECRET');
      }

      console.log('🔄 Refreshing Flutterwave access token...');

      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials'
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      this.accessToken = response.data.access_token;
      this.expiresIn = response.data.expires_in || 600; // Default to 10 minutes
      this.lastTokenRefreshTime = Date.now();

      console.log('✅ Flutterwave token refreshed successfully');
      console.log(`⏰ Token expires in ${this.expiresIn} seconds`);

      return this.accessToken;
    } catch (error) {
      console.error('❌ Error refreshing Flutterwave token:', error.response?.data || error.message);
      throw new Error(`Failed to refresh Flutterwave token: ${error.message}`);
    }
  }

  /**
   * Ensure token is valid and refresh if needed
   * Refreshes if less than 60 seconds remain (1 minute buffer)
   * @returns {Promise<string>} Valid access token
   */
  async ensureTokenIsValid() {
    const currentTime = Date.now();
    const timeSinceLastRefresh = (currentTime - this.lastTokenRefreshTime) / 1000; // Convert to seconds
    const timeLeft = this.expiresIn - timeSinceLastRefresh;

    if (!this.accessToken || timeLeft < 60) {
      // Token expired or about to expire (less than 1 minute left)
      console.log(`🔄 Token ${!this.accessToken ? 'missing' : 'expiring soon'} (${Math.floor(timeLeft)}s left). Refreshing...`);
      await this.refreshToken();
    } else {
      console.log(`✅ Token is still valid for ${Math.floor(timeLeft)} seconds`);
    }

    return this.accessToken;
  }

  /**
   * Get current access token (refresh if needed)
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    return await this.ensureTokenIsValid();
  }

  /**
   * Clear cached token (useful for testing or forced refresh)
   */
  clearToken() {
    this.accessToken = null;
    this.expiresIn = 0;
    this.lastTokenRefreshTime = 0;
  }
}

// Export singleton instance
module.exports = new FlutterwaveTokenManager();

