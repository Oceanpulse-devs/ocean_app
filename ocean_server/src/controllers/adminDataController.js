const db = require('../../models');

/**
 * Admin-only controller: returns all stored data for product demands (buyer needs),
 * products, distress sales, swap deals, auctions, and group buys.
 * No status/expiry filters; optional pagination via ?page=1&limit=100 (default limit 100, max 500).
 */
class AdminDataController {
  /**
   * GET /api/admin/data/buyer-needs
   * All buyer needs (product demands), any status.
   */
  async getAllBuyerNeedsData(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const offset = (page - 1) * limit;

      const { count, rows } = await db.BuyerNeed.findAndCountAll({
        where: {},
        include: [
          {
            model: db.UserTable,
            as: 'buyer',
            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
          },
          {
            model: db.BuyerNeedMedia,
            as: 'media',
            attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Admin getAllBuyerNeedsData error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch buyer needs data',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/data/products
   * All products, any status.
   */
  async getAllProductsData(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const offset = (page - 1) * limit;

      const { count, rows } = await db.Product.findAndCountAll({
        where: {},
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
            include: [
              {
                model: db.UserTable,
                as: 'user',
                attributes: ['id', 'fullName', 'email', 'profilePicture']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Admin getAllProductsData error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products data',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/data/distress-sales
   * All distress sale products (Product where isDistressSale = true), any status.
   */
  async getAllDistressSalesData(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const offset = (page - 1) * limit;

      const { count, rows } = await db.Product.findAndCountAll({
        where: { isDistressSale: true },
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'verificationStatus'],
            include: [
              {
                model: db.UserTable,
                as: 'user',
                attributes: ['id', 'fullName', 'email', 'profilePicture']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Admin getAllDistressSalesData error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distress sales data',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/data/swap-deals
   * All swap deals, any status.
   */
  async getAllSwapDealsData(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const offset = (page - 1) * limit;

      const { count, rows } = await db.SwapDeal.findAndCountAll({
        where: {},
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'fullName', 'username', 'profilePicture', 'email'],
            include: [
              {
                model: db.SellersTable,
                as: 'seller',
                attributes: ['id', 'businessName', 'businessEmail', 'businessPhone', 'businessAddress', 'verificationStatus']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Admin getAllSwapDealsData error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch swap deals data',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/data/auctions
   * All auctions, any status.
   */
  async getAllAuctionsData(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const offset = (page - 1) * limit;

      const { count, rows } = await db.Auction.findAndCountAll({
        where: {},
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'verificationStatus'],
            include: [
              {
                model: db.UserTable,
                as: 'user',
                attributes: ['id', 'username', 'fullName', 'email', 'profilePicture']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Admin getAllAuctionsData error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch auctions data',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/data/group-buys
   * All group buys, any status.
   */
  async getAllGroupBuysData(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const offset = (page - 1) * limit;

      const { count, rows } = await db.GroupBuy.findAndCountAll({
        where: {},
        include: [
          {
            model: db.UserTable,
            as: 'creator',
            attributes: ['id', 'fullName', 'username', 'email', 'profilePicture']
          },
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'fullName', 'username', 'email'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Admin getAllGroupBuysData error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch group buys data',
        error: error.message
      });
    }
  }
}

module.exports = new AdminDataController();
