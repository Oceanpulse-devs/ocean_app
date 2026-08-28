const db = require('../../models');
const zernioService = require('./zernioService');

class SocialAutoPostService {

  /**
   * Universal background auto-post trigger for all content types
   * 
   * @param {Object} options
   * @param {string} options.sellerId - Seller ID (from SellersTable or User ID)
   * @param {string} options.itemType - 'product' | 'auction' | 'group_buy' | 'swap_deal' | 'distress_sale' | 'post'
   * @param {Object} options.itemData - Item model data / attributes
   * @param {Array<string>} [options.targetPlatforms] - Optional array of target platforms e.g. ['facebook', 'instagram']
   * @param {string} [options.customCaption] - Optional custom caption override from seller
   */
  async triggerAutoPost({ sellerId, itemType, itemData, targetPlatforms, customCaption }) {
    // Run asynchronously without blocking the HTTP response thread
    setImmediate(async () => {
      try {
        await this.processAutoPost({ sellerId, itemType, itemData, targetPlatforms, customCaption });
      } catch (error) {
        console.error(`❌ Background social auto-post failed for ${itemType} (${itemData?.id}):`, error);
      }
    });
  }

  /**
   * Internal processing function for background worker
   */
  async processAutoPost({ sellerId, itemType, itemData, targetPlatforms, customCaption }) {
    const { SellerSocialAccount, SocialPostLog, SellersTable } = db;
    if (!sellerId || !itemData || !itemData.id) return;

    // Resolve seller record if sellerId is a userId
    let seller = await SellersTable.findByPk(sellerId);
    if (!seller) {
      seller = await SellersTable.findOne({ where: { userId: sellerId } });
    }
    const resolvedSellerId = seller ? seller.id : sellerId;

    // Find connected active social accounts for seller
    let socialAccounts = await SellerSocialAccount.findAll({
      where: {
        sellerId: resolvedSellerId,
        isConnected: true
      }
    });

    if (!socialAccounts || socialAccounts.length === 0) {
      console.log(`ℹ️ No connected social accounts found for seller ${resolvedSellerId}`);
      return;
    }

    // Filter by target platforms if specified by seller on form
    if (Array.isArray(targetPlatforms) && targetPlatforms.length > 0) {
      const platformSet = new Set(targetPlatforms.map(p => p.toLowerCase()));
      socialAccounts = socialAccounts.filter(acc => platformSet.has(acc.platform.toLowerCase()));
    } else {
      // Otherwise use accounts marked as autoPostDefault
      socialAccounts = socialAccounts.filter(acc => acc.autoPostDefault);
    }

    if (socialAccounts.length === 0) {
      console.log(`ℹ️ No active target social platforms selected for ${itemType} (${itemData.id})`);
      return;
    }

    // Format media URLs and deep link
    const mediaUrls = this.extractMediaUrls(itemData);
    const deepLink = this.generateDeepLink(itemType, itemData.id);
    const caption = this.formatCaption(itemType, itemData, customCaption, deepLink);

    // Publish to each target platform
    for (const account of socialAccounts) {
      try {
        const log = await SocialPostLog.create({
          sellerId: resolvedSellerId,
          itemType,
          itemId: itemData.id,
          platform: account.platform,
          status: 'pending'
        });

        const result = await zernioService.publishPost(account.zernioProfileId, {
          caption,
          mediaUrls,
          platform: account.platform,
          link: deepLink
        });

        if (result.success) {
          await log.update({
            status: 'success',
            zernioPostId: result.zernioPostId,
            publishedAt: new Date()
          });
          console.log(`✅ Auto-posted ${itemType} (${itemData.id}) to ${account.platform} (${account.accountName})`);
        } else {
          await log.update({
            status: 'failed',
            errorMessage: result.error || 'Failed to publish via Zernio'
          });
          console.error(`❌ Failed to auto-post ${itemType} (${itemData.id}) to ${account.platform}: ${result.error}`);
        }
      } catch (postErr) {
        console.error(`❌ Error executing auto-post to ${account.platform}:`, postErr);
      }
    }
  }

  /**
   * Extract image/video media URLs from item data
   */
  extractMediaUrls(itemData) {
    const urls = [];
    if (Array.isArray(itemData.images)) {
      urls.push(...itemData.images);
    } else if (typeof itemData.images === 'string') {
      try {
        const parsed = JSON.parse(itemData.images);
        if (Array.isArray(parsed)) urls.push(...parsed);
      } catch (e) {
        urls.push(itemData.images);
      }
    }

    if (itemData.media && Array.isArray(itemData.media)) {
      itemData.media.forEach(m => {
        if (typeof m === 'string') urls.push(m);
        else if (m?.mediaUrl) urls.push(m.mediaUrl);
        else if (m?.url) urls.push(m.url);
      });
    }

    if (itemData.videoUrl) urls.push(itemData.videoUrl);

    return urls.filter(u => typeof u === 'string' && u.startsWith('http')).slice(0, 5);
  }

  /**
   * Generate Bluewhale Marketplace web deep link for item
   */
  generateDeepLink(itemType, itemId) {
    const baseUrl = process.env.FRONTEND_URL || 'https://bluewhalemarketplace.com';
    switch (itemType) {
      case 'product': return `${baseUrl}/products/${itemId}`;
      case 'auction': return `${baseUrl}/auctions/${itemId}`;
      case 'group_buy': return `${baseUrl}/group-buys/${itemId}`;
      case 'swap_deal': return `${baseUrl}/swap-deals/${itemId}`;
      case 'distress_sale': return `${baseUrl}/distress-sales/${itemId}`;
      case 'post': return `${baseUrl}/posts/${itemId}`;
      default: return `${baseUrl}/products/${itemId}`;
    }
  }

  /**
   * Format caption using seller's custom override or feature-specific default template
   */
  formatCaption(itemType, itemData, customCaption, deepLink) {
    if (customCaption && customCaption.trim() !== '') {
      return `${customCaption.trim()}\n\n🔗 View on Bluewhale: ${deepLink}`;
    }

    const title = itemData.title || itemData.name || itemData.productName || 'Special Item';
    const price = itemData.price || itemData.currentPrice || itemData.group_price || itemData.startingPrice || 0;
    const currency = itemData.currency === 'USD' ? '$' : '₦';
    const description = itemData.description || '';
    const location = itemData.location || itemData.meetingLocation || '';

    switch (itemType) {
      case 'product':
        return `🛍️ ${title}\n💰 Price: ${currency}${price.toLocaleString()}\n${location ? `📍 Location: ${location}\n` : ''}\n${description}\n\n🔗 Shop directly on Bluewhale Marketplace:\n${deepLink}`;

      case 'auction':
        return `🏷️ LIVE AUCTION: ${title}\n💰 Starting Bid: ${currency}${price.toLocaleString()}\n${itemData.endTime ? `⏰ Bids End: ${new Date(itemData.endTime).toLocaleDateString()}\n` : ''}\n${description}\n\n🔨 Place your bid on Bluewhale:\n${deepLink}`;

      case 'group_buy':
        return `👥 GROUP BUY DEAL: ${title}\n💰 Group Price: ${currency}${price.toLocaleString()}\n${itemData.minBuyers ? `🎯 Target Buyers: ${itemData.minBuyers} buyers needed\n` : ''}\n${description}\n\n🤝 Join Group Buy on Bluewhale:\n${deepLink}`;

      case 'swap_deal':
        return `🔄 SWAP DEAL: ${itemData.productToSwap || title}\n🔁 Looking For: ${itemData.preferredItems || itemData.lookingFor || 'Fair Swap'}\n${location ? `📍 Location: ${location}\n` : ''}\n${description}\n\n🤝 Propose a swap on Bluewhale:\n${deepLink}`;

      case 'distress_sale':
        return `⚡ DISTRESS SALE: ${title}\n🔥 Price: ${currency}${price.toLocaleString()}${itemData.discountPercentage ? ` (${itemData.discountPercentage}% OFF)` : ''}\n${description}\n\n⚡ Grab this deal on Bluewhale:\n${deepLink}`;

      case 'post':
        return `📹 ${title}\n\n${description}\n\n🔗 View on Bluewhale Marketplace:\n${deepLink}`;

      default:
        return `🛍️ ${title}\n💰 Price: ${currency}${price.toLocaleString()}\n\n${description}\n\n🔗 View on Bluewhale:\n${deepLink}`;
    }
  }
}

module.exports = new SocialAutoPostService();
