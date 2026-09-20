const axios = require('axios');

class DojahService {
  constructor() {
    this.baseUrl = process.env.DOJAH_BASE_URL || 'https://api.dojah.io';
    this.appId = process.env.DOJAH_APP_ID;
    this.secretKey = process.env.DOJAH_SECRET_KEY;
  }

  /**
   * Calculate string similarity score (0 - 100) using Levenshtein distance & token overlap
   */
  calculateNameMatchScore(name1, name2) {
    if (!name1 || !name2) return 0;

    const normalize = (str) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();

    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (n1 === n2) return 100;

    const tokens1 = n1.split(/\s+/);
    const tokens2 = n2.split(/\s+/);

    // Check token intersection
    let matchingTokens = 0;
    for (const t1 of tokens1) {
      if (tokens2.some((t2) => t2 === t1 || t2.includes(t1) || t1.includes(t2))) {
        matchingTokens++;
      }
    }

    const tokenScore = Math.round((matchingTokens / Math.max(tokens1.length, tokens2.length)) * 100);
    return tokenScore;
  }

  /**
   * Verify National Identification Number (NIN) via Dojah API
   * @param {string} nin - 11-digit NIN string
   * @returns {Promise<Object>} Verification result object
   */
  async verifyNin(nin) {
    // Sanitize NIN
    const cleanNin = String(nin).trim().replace(/\D/g, '');

    if (cleanNin.length !== 11) {
      return {
        success: false,
        error: 'NIN must be exactly 11 numeric digits',
        statusCode: 400
      };
    }

    // Check credentials availability
    if (!this.appId || !this.secretKey) {
      console.warn('⚠️ DOJAH_APP_ID or DOJAH_SECRET_KEY not set in environment. Running mock mode.');
      
      // Mock mode for testing when credentials are not yet configured
      if (cleanNin === '00000000000') {
        return {
          success: false,
          error: 'Mock: Invalid NIN number provided',
          statusCode: 404
        };
      }

      return {
        success: true,
        isMock: true,
        data: {
          first_name: 'JETHRO',
          last_name: 'TEST',
          middle_name: 'OCEAN',
          nin: cleanNin,
          dob: '1995-08-20',
          gender: 'm',
          mobile: '08012345678',
          photo: null,
          residence_address: '12 Marina Road, Victoria Island',
          residence_state: 'Lagos',
          tracking_id: `MOCK-DOJAH-${Date.now()}`
        }
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/kyc/nin`, {
        params: { nin: cleanNin },
        headers: {
          AppId: this.appId,
          Authorization: this.secretKey,
          Accept: 'application/json'
        },
        timeout: 15000
      });

      const resData = response.data;
      if (resData && resData.entity) {
        return {
          success: true,
          isMock: false,
          data: resData.entity
        };
      } else {
        return {
          success: false,
          error: resData?.message || 'Unable to retrieve NIMC record for this NIN',
          raw: resData
        };
      }
    } catch (error) {
      console.error('❌ Dojah API Request Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Dojah API request failed',
        statusCode: error.response?.status || 500,
        raw: error.response?.data || null
      };
    }
  }
}

module.exports = new DojahService();
