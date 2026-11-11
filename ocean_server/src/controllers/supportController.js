const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { UserTable, SellersTable } = require('../../models');

/**
 * Support Controller (Chatwoot Customer Support Integration)
 *
 * Provides dynamic Chatwoot configuration, HMAC-SHA256 identity verification,
 * and an embeddable mobile WebView / browser test page.
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

      const customAttributes = {
        account_type: user.accountType || 'buyer',
        username: user.username || '',
        is_verified_seller: isVerifiedSeller,
        verification_status: seller ? seller.verificationStatus : 'none',
        business_name: seller?.businessName || user.businessName || '',
        seller_type: seller?.sellerType || '',
        country: seller?.country || user.location || '',
        state: seller?.state || ''
      };

      const phoneNumber = seller?.phoneNumber || seller?.businessPhone || null;
      const avatarUrl = user.profilePicture || null;

      return res.status(200).json({
        success: true,
        data: {
          enabled: Boolean(websiteToken),
          provider: 'chatwoot',
          baseUrl,
          websiteToken,
          user: {
            identifier,
            identifierHash,
            identifier_hash: identifierHash,
            name: user.fullName || user.username || 'BlueWhale User',
            email: user.email,
            avatarUrl,
            avatar_url: avatarUrl,
            phoneNumber,
            phone_number: phoneNumber,
            customAttributes,
            custom_attributes: customAttributes
          }
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
   * Renders a full-screen Chatwoot Support page (can be opened in a browser to test
   * or embedded directly in the mobile app via WebView with ?token=<JWT>)
   */
  static async renderSupportWidget(req, res) {
    try {
      const baseUrl = (process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com')
        .trim()
        .replace(/\/+$/, '');
      const websiteToken = (process.env.CHATWOOT_WEBSITE_TOKEN || '').trim();
      const hmacToken = (process.env.CHATWOOT_HMAC_TOKEN || '').trim();

      // Resolve user if a JWT token is passed via ?token= or Authorization header
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
            const identifier = String(user.id);
            const identifierHash = hmacToken
              ? crypto.createHmac('sha256', hmacToken).update(identifier).digest('hex')
              : undefined;
            const isVerifiedSeller = Boolean(
              seller &&
                (seller.isVerified ||
                  seller.verificationStatus === 'approved' ||
                  seller.verificationStatus === 'active')
            );
            userPayload = {
              identifier,
              identifier_hash: identifierHash,
              name: user.fullName || user.username || 'BlueWhale User',
              email: user.email,
              avatar_url: user.profilePicture || '',
              phone_number: seller?.phoneNumber || seller?.businessPhone || '',
              custom_attributes: {
                account_type: user.accountType || 'buyer',
                username: user.username || '',
                is_verified_seller: isVerifiedSeller,
                business_name: seller?.businessName || user.businessName || '',
                country: seller?.country || user.location || ''
              }
            };
          }
        } catch (err) {
          // Ignore invalid token and fall back to test/guest user if provided
        }
      }

      // Allow quick testing via query params (?name=Rinfwang&email=...)
      if (!userPayload && (req.query.name || req.query.test === 'true')) {
        const testId = req.query.id || 'test-seller-rinfwang-001';
        const identifierHash = hmacToken
          ? crypto.createHmac('sha256', hmacToken).update(testId).digest('hex')
          : undefined;
        userPayload = {
          identifier: testId,
          identifier_hash: identifierHash,
          name: req.query.name || 'Rinfwang (BlueWhale Test)',
          email: req.query.email || 'rinfwang4@gmail.com',
          custom_attributes: {
            account_type: 'seller',
            is_verified_seller: true,
            business_name: 'BlueWhale Official Store',
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
  <title>BlueWhale Customer Support</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    .loader {
      max-width: 320px;
      padding: 24px;
    }
    .loader h2 {
      font-size: 1.2rem;
      margin-bottom: 8px;
    }
    .loader p {
      font-size: 0.9rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="loader">
    <h2>🐳 BlueWhale Support</h2>
    <p>Opening live support chat...</p>
  </div>

  <script>
    window.chatwootSettings = {
      hideMessageBubble: false,
      position: 'right',
      locale: 'en',
      type: 'expanded_bubble',
      launcherTitle: 'Chat with us'
    };

    const userPayload = ${serializedUser};

    window.addEventListener('chatwoot:ready', function () {
      if (userPayload && window.$chatwoot) {
        window.$chatwoot.setUser(userPayload.identifier, {
          name: userPayload.name,
          email: userPayload.email,
          avatar_url: userPayload.avatar_url,
          phone_number: userPayload.phone_number,
          identifier_hash: userPayload.identifier_hash
        });
        if (userPayload.custom_attributes) {
          window.$chatwoot.setCustomAttributes(userPayload.custom_attributes);
        }
      }
      if (window.$chatwoot) {
        window.$chatwoot.toggle('open');
      }
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
        })
      }
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
