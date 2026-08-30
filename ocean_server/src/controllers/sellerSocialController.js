const db = require('../../models');
const zernioService = require('../services/zernioService');

class SellerSocialController {

  /**
   * Helper: Resolve seller record for authenticated user
   */
  async resolveSeller(userId) {
    const { SellersTable } = db;
    let seller = await SellersTable.findOne({ where: { userId } });
    if (!seller) {
      seller = await SellersTable.findByPk(userId);
    }
    return seller;
  }

  /**
   * GET /api/seller/social/settings
   * Fetch connected social accounts & default settings
   */
  async getSocialSettings(req, res) {
    try {
      const userId = req.user.id;
      const seller = await this.resolveSeller(userId);

      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can access social integration settings'
        });
      }

      const { SellerSocialAccount } = db;
      const accounts = await SellerSocialAccount.findAll({
        where: { sellerId: seller.id },
        order: [['created_at', 'DESC']]
      });

      const formattedAccounts = accounts.map(acc => ({
        id: acc.id,
        platform: acc.platform,
        accountName: acc.accountName,
        accountId: acc.accountId,
        isConnected: acc.isConnected,
        autoPostDefault: acc.autoPostDefault,
        connectedAt: acc.created_at || acc.createdAt
      }));

      // Calculate global default (true if any connected account is set to default ON)
      const globalAutoPostDefault = accounts.length > 0
        ? accounts.some(acc => acc.autoPostDefault && acc.isConnected)
        : true;

      return res.status(200).json({
        success: true,
        data: {
          autoPostDefault: globalAutoPostDefault,
          connectedAccounts: formattedAccounts
        }
      });
    } catch (error) {
      console.error('Error fetching seller social settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve social settings',
        error: error.message
      });
    }
  }

  /**
   * POST /api/seller/social/connect-url
   * Generate Zernio OAuth connection URL
   */
  async getConnectUrl(req, res) {
    try {
      const userId = req.user.id;
      const { platform } = req.body || {};

      if (!platform) {
        return res.status(400).json({
          success: false,
          message: 'Target platform is required (facebook, instagram, whatsapp)'
        });
      }

      const seller = await this.resolveSeller(userId);
      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can connect social accounts'
        });
      }

      // Pass seller object so zernioService can fetch/create Zernio profileId (POST /v1/profiles)
      const result = await zernioService.getConnectUrl(seller, platform.toLowerCase());

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to fetch Zernio connect URL',
          details: result.error
        });
      }

      return res.status(200).json({
        success: true,
        message: `Connect URL generated for ${platform}`,
        data: {
          platform: platform.toLowerCase(),
          connectUrl: result.connectUrl || result.authUrl,
          authUrl: result.authUrl || result.connectUrl,
          profileId: result.profileId
        }
      });
    } catch (error) {
      const errorData = error.response?.data || error.message;
      console.error('Error generating social connect URL:', errorData);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate connection URL',
        error: error.response?.data?.message || error.message,
        details: errorData
      });
    }
  }

  /**
   * GET /api/seller/social/callback
   * Handle OAuth redirect callback from Zernio
   */
  async handleOAuthCallback(req, res) {
    try {
      console.log('📡 [Zernio OAuth Callback Received]:', req.query);
      const { seller_id, sellerId, zernio_profile_id, profileId, platform, account_name, accountName } = req.query;

      const targetSellerId = sellerId || seller_id;
      const targetProfileId = profileId || zernio_profile_id;
      const targetPlatform = platform || 'facebook';

      if (targetSellerId && targetProfileId) {
        const { SellerSocialAccount } = db;
        await SellerSocialAccount.upsert({
          sellerId: targetSellerId,
          zernioProfileId: targetProfileId,
          platform: targetPlatform.toLowerCase(),
          accountName: accountName || account_name || `${targetPlatform} Account`,
          accountId: targetProfileId,
          isConnected: true,
          autoPostDefault: true
        });
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Social Account Connected</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #fff; text-align: center; }
            .card { background: #1e293b; padding: 2rem; border-radius: 16px; max-width: 90%; width: 360px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            .icon { font-size: 48px; margin-bottom: 12px; }
            h2 { margin: 0 0 8px 0; font-size: 20px; color: #38bdf8; }
            p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
            button { background: #0284c7; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h2>Account Connected!</h2>
            <p>Your social account was linked to Bluewhale Marketplace successfully.</p>
            <button onclick="window.close()">Return to App</button>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).send('Error completing social connection.');
    }
  }

  /**
   * PUT /api/seller/social/settings
   * Update global auto-post default setting or account toggles
   */
  async updateSocialSettings(req, res) {
    try {
      const userId = req.user.id;
      const { autoPostDefault, accountId, autoPostEnabled } = req.body || {};

      const seller = await this.resolveSeller(userId);
      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Seller profile required'
        });
      }

      const { SellerSocialAccount } = db;

      if (accountId !== undefined) {
        // Toggle specific account
        const account = await SellerSocialAccount.findOne({
          where: { id: accountId, sellerId: seller.id }
        });
        if (account) {
          await account.update({ autoPostDefault: !!autoPostEnabled });
        }
      } else if (autoPostDefault !== undefined) {
        // Update all connected accounts for seller
        await SellerSocialAccount.update(
          { autoPostDefault: !!autoPostDefault },
          { where: { sellerId: seller.id } }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Social auto-post settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating social settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/seller/social/accounts/:accountId
   * Disconnect a social account
   */
  async disconnectAccount(req, res) {
    try {
      const userId = req.user.id;
      const { accountId } = req.params;

      const seller = await this.resolveSeller(userId);
      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Seller profile required'
        });
      }

      const { SellerSocialAccount } = db;
      const account = await SellerSocialAccount.findOne({
        where: { id: accountId, sellerId: seller.id }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Social account connection not found'
        });
      }

      await account.destroy();

      return res.status(200).json({
        success: true,
        message: 'Social account disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting social account:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to disconnect social account',
        error: error.message
      });
    }
  }

  /**
   * GET /api/seller/social/logs
   * Fetch social publication logs for seller dashboard
   */
  async getAutoPostLogs(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const seller = await this.resolveSeller(userId);
      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Seller profile required'
        });
      }

      const { SocialPostLog } = db;
      const { count, rows } = await SocialPostLog.findAndCountAll({
        where: { sellerId: seller.id },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.status(200).json({
        success: true,
        data: {
          logs: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching social post logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve social post logs',
        error: error.message
      });
    }
  }

  /**
   * POST /api/seller/social/webhooks/zernio
   * Handle incoming Zernio webhooks (Account Connected & Post Status Updates)
   */
  async handleZernioWebhook(req, res) {
    try {
      const payload = req.body || {};
      const { event, sellerId, zernioProfileId, platform, accountName, accountId, zernioPostId, status, error } = payload;

      console.log('📡 [Zernio Webhook Received]:', { event, sellerId, platform, zernioProfileId });

      const { SellerSocialAccount, SocialPostLog } = db;

      // Event 1: Social Account Connected
      if (event === 'account.connected' || event === 'account_connected' || (zernioProfileId && sellerId && platform)) {
        await SellerSocialAccount.upsert({
          sellerId,
          zernioProfileId,
          platform: (platform || 'facebook').toLowerCase(),
          accountName: accountName || `${platform} Account`,
          accountId: accountId || zernioProfileId,
          isConnected: true,
          autoPostDefault: true
        });
        console.log(`✅ [Zernio Webhook] Social account connected for seller ${sellerId}: ${platform}`);
      }

      // Event 2: Social Account Disconnected
      if (event === 'account.disconnected' || event === 'account_disconnected') {
        if (zernioProfileId || accountId) {
          await SellerSocialAccount.update(
            { isConnected: false },
            { where: { zernioProfileId: zernioProfileId || accountId } }
          );
          console.log(`⚠️ [Zernio Webhook] Social account disconnected: ${zernioProfileId || accountId}`);
        }
      }

      // Event 3: Post Status Updates
      if (event === 'post.published' || event === 'post.platform.published' || event === 'post_published' || event === 'post.failed' || event === 'post.platform.failed' || zernioPostId) {
        const isSuccess = event === 'post.published' || event === 'post.platform.published' || status === 'success' || status === 'published';
        const log = await SocialPostLog.findOne({ where: { zernioPostId } });
        if (log) {
          await log.update({
            status: isSuccess ? 'success' : 'failed',
            errorMessage: isSuccess ? null : (error || 'Publication failed'),
            publishedAt: isSuccess ? new Date() : log.publishedAt
          });
          console.log(`✅ [Zernio Webhook] Updated log for post ${zernioPostId}: ${isSuccess ? 'success' : 'failed'}`);
        }
      }

      return res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      console.error('Zernio Webhook Error:', error);
      return res.status(500).json({ success: false, message: 'Webhook processing error', error: error.message });
    }
  }
}

const controller = new SellerSocialController();
module.exports = {
  getSocialSettings: controller.getSocialSettings.bind(controller),
  getConnectUrl: controller.getConnectUrl.bind(controller),
  updateSocialSettings: controller.updateSocialSettings.bind(controller),
  disconnectAccount: controller.disconnectAccount.bind(controller),
  getAutoPostLogs: controller.getAutoPostLogs.bind(controller),
  handleZernioWebhook: controller.handleZernioWebhook.bind(controller),
  handleOAuthCallback: controller.handleOAuthCallback.bind(controller)
};
