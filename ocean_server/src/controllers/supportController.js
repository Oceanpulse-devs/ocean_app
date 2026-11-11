const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { UserTable, SellersTable } = require('../../models');

/**
 * Helper to build the verified Chatwoot user payload for a given user & seller record.
 * Note: We intentionally place phone_number inside custom_attributes rather than the
 * top-level user object because Chatwoot's Rails validator rejects the entire setUser
 * request (422 Unprocessable Entity - dropping name & email) if phone_number is not in
 * strict E.164 carrier format or if it collides with another test account.
 */
function buildChatwootUserPayload(user, seller, hmacToken) {
  const identifier = String(user.id);
  const identifierHash = hmacToken
    ? crypto.createHmac('sha256', hmacToken).update(identifier).digest('hex')
    : null;

  const isVerifiedSeller = Boolean(
    seller &&
      (seller.isVerified ||
        seller.verificationStatus === 'approved' ||
        seller.verificationStatus === 'active')
  );

  const rawName = (user.fullName || user.username || 'BlueWhale User').trim();
  const shopName = (seller?.businessName || user.businessName || '').trim();
  const displayName =
    isVerifiedSeller && shopName && !rawName.toLowerCase().includes(shopName.toLowerCase())
      ? `${rawName} (${shopName})`
      : rawName;

  const phoneNumber = (seller?.phoneNumber || seller?.businessPhone || '').trim();
  const avatarUrl =
    user.profilePicture && user.profilePicture !== '👤' ? user.profilePicture : '';

  const customAttributes = {
    account_type: user.accountType || (seller ? 'seller' : 'buyer'),
    username: user.username || '',
    phone_number: phoneNumber,
    is_verified_seller: isVerifiedSeller,
    verification_status: seller ? seller.verificationStatus : 'none',
    business_name: shopName,
    seller_type: seller?.sellerType || '',
    country: seller?.country || user.location || '',
    state: seller?.state || ''
  };

  return {
    identifier,
    identifierHash,
    identifier_hash: identifierHash,
    name: displayName,
    email: (user.email || '').trim(),
    avatarUrl: avatarUrl || null,
    avatar_url: avatarUrl || null,
    customAttributes,
    custom_attributes: customAttributes
  };
}

/**
 * Support Controller (Chatwoot Customer Support Integration)
 */
class SupportController {
  /**
   * GET /api/support/config
   * Returns Chatwoot connection settings, authenticated user profile, and HMAC hash
   */
  static async getSupportConfig(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const baseUrl = (process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com')
        .trim()
        .replace(/\/+$/, '');
      const websiteToken = (process.env.CHATWOOT_WEBSITE_TOKEN || '').trim();
      const hmacToken = (process.env.CHATWOOT_HMAC_TOKEN || '').trim();

      const [user, seller] = await Promise.all([
        UserTable.findOne({ where: { id: userId } }),
        SellersTable.findOne({ where: { userId } })
      ]);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userPayload = buildChatwootUserPayload(user, seller, hmacToken);

      // Extract raw Bearer token so we can provide a ready-to-open full-screen widgetUrl
      const authHeader = req.headers.authorization || '';
      const rawToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.get('host');
      const widgetUrl = rawToken
        ? `${protocol}://${host}/api/support/widget?token=${encodeURIComponent(rawToken)}`
        : `${protocol}://${host}/api/support/widget`;

      return res.status(200).json({
        success: true,
        data: {
          enabled: Boolean(websiteToken),
          provider: 'chatwoot',
          baseUrl,
          websiteToken,
          widgetUrl,
          user: userPayload
        }
      });
    } catch (error) {
      console.error('Error generating Chatwoot support config:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve support configuration',
        error: error.message
      });
    }
  }

  /**
   * GET /api/support/widget
   * Renders a full-screen Chatwoot Support interface that automatically authenticates
   * the user via HMAC-SHA256 as soon as the widget iframe is ready.
   */
  static async renderSupportWidget(req, res) {
    try {
      const baseUrl = (process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com')
        .trim()
        .replace(/\/+$/, '');
      const websiteToken = (process.env.CHATWOOT_WEBSITE_TOKEN || '').trim();
      const hmacToken = (process.env.CHATWOOT_HMAC_TOKEN || '').trim();

      let userPayload = null;
      const rawToken =
        req.query.token ||
        (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
          ? req.headers.authorization.substring(7)
          : null);

      if (rawToken && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
          const [user, seller] = await Promise.all([
            UserTable.findOne({ where: { id: decoded.id } }),
            SellersTable.findOne({ where: { userId: decoded.id } })
          ]);
          if (user) {
            userPayload = buildChatwootUserPayload(user, seller, hmacToken);
          }
        } catch (err) {
          console.warn('Support widget JWT decode warning:', err.message);
        }
      }

      // Allow direct query param fallback for mobile WebViews or testing (?id=...&name=...&email=...)
      if (!userPayload && (req.query.name || req.query.email || req.query.test === 'true')) {
        const fallbackId = String(req.query.id || req.query.identifier || 'bluewhale-test-user-01');
        const identifierHash = hmacToken
          ? crypto.createHmac('sha256', hmacToken).update(fallbackId).digest('hex')
          : null;
        userPayload = {
          identifier: fallbackId,
          identifierHash,
          identifier_hash: identifierHash,
          name: req.query.name || 'Rinfwang (BlueWhale Seller)',
          email: req.query.email || 'rinfwang4@gmail.com',
          avatar_url: req.query.avatar || '',
          custom_attributes: {
            account_type: req.query.role || 'seller',
            is_verified_seller: true,
            business_name: req.query.shop || 'BlueWhale Official Store',
            country: 'Nigeria'
          }
        };
      }

      const serializedUser = JSON.stringify(userPayload);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>BlueWhale Live Support</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    /* Force Chatwoot widget to fill 100% of the mobile WebView screen */
    .woot-widget-holder,
    .woot-widget-holder.woot-elements--right,
    .woot-widget-holder.woot-elements--left {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      margin: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      z-index: 999999 !important;
    }
    .woot-widget-holder iframe {
      width: 100% !important;
      height: 100% !important;
      min-height: 100vh !important;
      border-radius: 0 !important;
    }
    /* Hide the floating launcher bubble since the chat is full-screen */
    .woot--bubble-holder {
      display: none !important;
    }
  </style>
</head>
<body>
  <script>
    window.chatwootSettings = {
      hideMessageBubble: true,
      position: 'right',
      locale: 'en',
      useBrowserLanguage: false,
      type: 'standard',
      darkMode: 'auto'
    };

    var userPayload = ${serializedUser};

    function syncUserIdentity() {
      if (!userPayload || !window.$chatwoot) return;
      var userObj = {
        name: userPayload.name,
        email: userPayload.email
      };
      if (userPayload.avatar_url) {
        userObj.avatar_url = userPayload.avatar_url;
      }
      if (userPayload.identifier_hash) {
        userObj.identifier_hash = userPayload.identifier_hash;
      }
      window.$chatwoot.setUser(userPayload.identifier, userObj);

      if (userPayload.custom_attributes) {
        window.$chatwoot.setCustomAttributes(userPayload.custom_attributes);
      }
    }

    window.addEventListener('chatwoot:ready', function () {
      syncUserIdentity();
      if (window.$chatwoot) {
        window.$chatwoot.toggle('open');
      }
      // Re-sync after 800ms and 2500ms to ensure identity is applied even on slow networks
      setTimeout(syncUserIdentity, 800);
      setTimeout(syncUserIdentity, 2500);
    });

    (function(d,t) {
      var BASE_URL="${baseUrl}";
      var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
      g.src=BASE_URL+"/packs/js/sdk.js";
      g.defer = true;
      g.async = true;
      s.parentNode.insertBefore(g,s);
      g.onload=function(){
        window.chatwootSDK.run({
          websiteToken: '${websiteToken}',
          baseUrl: BASE_URL
        });
      };
    })(document,"script");
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (error) {
      console.error('Error rendering Chatwoot widget:', error);
      return res.status(500).send('Failed to load support widget');
    }
  }
}

module.exports = SupportController;
