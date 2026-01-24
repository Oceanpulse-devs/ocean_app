const db = require('../../models');
const { Op } = require('sequelize');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { sendSellerApplicationNotification } = require('./notificationController');

class SellerManagementController {
  // Get all sellers with filtering and pagination
  async getAllSellers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        category,
        country,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (status) {
        whereClause.verificationStatus = status;
      }
      if (category) {
        whereClause.category = category;
      }
      if (country) {
        whereClause.country = country;
      }
      if (search) {
        whereClause[Op.or] = [
          { businessName: { [Op.like]: `%${search}%` } },
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const sellers = await db.SellersTable.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email', 'accountStatus', 'lastActive']
          },
          {
            model: db.SellerDocument,
            as: 'documents',
            required: false,  // Ensure documents are included even if seller has none
            attributes: [
              'id', 
              'documentType', 
              'documentNumber',  // Document number for ID cards
              'status', 
              'submittedAt', 
              'documentImage',  // Front image
              'documentBackImage'  // Back image for ID cards
            ]
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map sellers to include category from selectedCategories
      const sellersWithCategory = sellers.rows.map(seller => {
        const sellerData = seller.toJSON();
        // Get first category from selectedCategories array if category field is empty
        if (!sellerData.category && sellerData.selectedCategories && Array.isArray(sellerData.selectedCategories) && sellerData.selectedCategories.length > 0) {
          sellerData.category = sellerData.selectedCategories[0];
        }
        return sellerData;
      });

      res.json({
        success: true,
        data: {
          sellers: sellersWithCategory,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(sellers.count / limit),
            totalItems: sellers.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting all sellers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get pending sellers
  async getPendingSellers(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const sellers = await db.SellersTable.findAndCountAll({
        where: { verificationStatus: 'pending' },
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email', 'accountStatus', 'lastActive']
          },
          {
            model: db.SellerDocument,
            as: 'documents',
            required: false,  // Ensure documents are included even if seller has none
            attributes: [
              'id', 
              'documentType', 
              'documentNumber',  // Document number for ID cards
              'status', 
              'submittedAt', 
              'documentImage',  // Front image - THIS WAS MISSING!
              'documentBackImage'  // Back image for ID cards
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map sellers to include category from selectedCategories
      const sellersWithCategory = sellers.rows.map(seller => {
        const sellerData = seller.toJSON();
        // Get first category from selectedCategories array if category field is empty
        if (!sellerData.category && sellerData.selectedCategories && Array.isArray(sellerData.selectedCategories) && sellerData.selectedCategories.length > 0) {
          sellerData.category = sellerData.selectedCategories[0];
        }
        return sellerData;
      });

      res.json({
        success: true,
        data: {
          sellers: sellersWithCategory,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(sellers.count / limit),
            totalItems: sellers.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting pending sellers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get seller by ID
  async getSellerById(req, res) {
    try {
      const { id } = req.params;

      const seller = await db.SellersTable.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email', 'accountStatus', 'lastActive', 'createdAt']
          },
          {
            model: db.SellerDocument,
            as: 'documents',
            required: false,  // Ensure documents are included even if seller has none
            attributes: [
              'id', 
              'documentType', 
              'documentNumber',  // Document number for ID cards
              'status', 
              'submittedAt', 
              'documentImage',  // Front image
              'documentBackImage'  // Back image for ID cards
            ]
          }
        ]
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      // Map seller to include category from selectedCategories
      const sellerData = seller.toJSON();
      // Get first category from selectedCategories array if category field is empty
      if (!sellerData.category && sellerData.selectedCategories && Array.isArray(sellerData.selectedCategories) && sellerData.selectedCategories.length > 0) {
        sellerData.category = sellerData.selectedCategories[0];
      }

      res.json({
        success: true,
        data: sellerData
      });

    } catch (error) {
      console.error('Error getting seller by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Approve seller
  async approveSeller(req, res) {
    try {
      const { id } = req.params;
      const { verificationLevel = 'basic', verificationNotes } = req.body;

      const seller = await db.SellersTable.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      console.log('🔍 ADMIN APPROVAL DEBUG:');
      console.log('   Seller ID:', id);
      console.log('   Found Seller:', seller ? 'YES' : 'NO');
      if (seller) {
        console.log('   Business Name:', seller.businessName);
        console.log('   Full Name:', seller.fullName);
        console.log('   User ID:', seller.userId);
        console.log('   Verification Status:', seller.verificationStatus);
        console.log('   Created At:', seller.createdAt);
      }

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      if (seller.verificationStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Seller is already approved'
        });
      }

      // Update seller status
      await seller.update({
        verificationStatus: 'approved',
        verificationLevel,
        verificationNotes,
        verifiedAt: new Date(),
        verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        verificationScore: 85 // Default score for approved sellers
      });

      // Update user account type
      await db.UserTable.update(
        { accountType: 'seller' },
        { where: { id: seller.userId } }
      );

      // Send notification to user (in-app notification)
      await sendSellerApplicationNotification(seller.userId, 'approved');

      // Send approval email to seller
      try {
        const userEmail = seller.user?.email || seller.email;
        const userName = seller.fullName || seller.user?.username || 'Seller';
        const businessName = seller.businessName || 'Your business';
        
        const emailTemplate = emailTemplates.sellerApplicationApproved(userName, businessName);
        await sendEmail(
          userEmail,
          emailTemplate.subject,
          emailTemplate.html,
          'seller-approval'
        );
        console.log('✅ Seller approval email sent to:', userEmail);
      } catch (emailError) {
        console.error('❌ Failed to send seller approval email:', emailError);
        // Don't fail approval if email fails
      }

      // Reload seller with updated data and associations
      const updatedSeller = await db.SellersTable.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email', 'accountType', 'accountStatus']
          }
        ]
      });

      // Map seller to include category from selectedCategories
      const sellerData = updatedSeller.toJSON();
      // Get first category from selectedCategories array if category field is empty
      if (!sellerData.category && sellerData.selectedCategories && Array.isArray(sellerData.selectedCategories) && sellerData.selectedCategories.length > 0) {
        sellerData.category = sellerData.selectedCategories[0];
      }

      res.json({
        success: true,
        message: 'Seller approved successfully',
        data: sellerData
      });

    } catch (error) {
      console.error('Error approving seller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Reject seller
  async rejectSeller(req, res) {
    try {
      const { id } = req.params;
      const { rejectionReason, verificationNotes } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const seller = await db.SellersTable.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      if (seller.verificationStatus === 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Seller is already rejected'
        });
      }

      // Update seller status
      await seller.update({
        verificationStatus: 'rejected',
        rejectionReason,
        verificationNotes,
        verificationScore: 0
      });

      // Send in-app notification (and FCM if token registered)
      await sendSellerApplicationNotification(seller.userId, 'rejected', rejectionReason);

      // Send rejection email with reason
      try {
        const userEmail = seller.user?.email || seller.email;
        const userName = seller.fullName || seller.user?.username || 'Seller';
        const emailTemplate = emailTemplates.sellerApplicationRejected(userName, rejectionReason);
        await sendEmail(
          userEmail,
          emailTemplate.subject,
          emailTemplate.html,
          'seller-rejection'
        );
        console.log('✅ Seller rejection email sent to:', userEmail);
      } catch (emailError) {
        console.error('❌ Failed to send seller rejection email:', emailError);
        // Don't fail the reject API if email fails
      }

      res.json({
        success: true,
        message: 'Seller rejected successfully',
        data: seller
      });

    } catch (error) {
      console.error('Error rejecting seller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Suspend seller
  async suspendSeller(req, res) {
    try {
      const { id } = req.params;
      const { suspensionReason, suspensionDuration } = req.body;

      if (!suspensionReason) {
        return res.status(400).json({
          success: false,
          message: 'Suspension reason is required'
        });
      }

      const seller = await db.SellersTable.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      // Calculate suspension end date
      const suspensionEndDate = suspensionDuration 
        ? new Date(Date.now() + suspensionDuration * 24 * 60 * 60 * 1000)
        : null;

      // Update seller status
      await seller.update({
        verificationStatus: 'suspended',
        suspensionReason,
        suspensionStartDate: new Date(),
        suspensionEndDate,
        verificationNotes: `Suspended: ${suspensionReason}`
      });

      // Update user account status
      await db.UserTable.update(
        { accountStatus: 'suspended' },
        { where: { id: seller.userId } }
      );

      res.json({
        success: true,
        message: 'Seller suspended successfully',
        data: seller
      });

    } catch (error) {
      console.error('Error suspending seller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Activate seller
  async activateSeller(req, res) {
    try {
      const { id } = req.params;
      const { activationNotes } = req.body;

      const seller = await db.SellersTable.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      // Update seller status
      await seller.update({
        verificationStatus: 'active',
        suspensionReason: null,
        suspensionStartDate: null,
        suspensionEndDate: null,
        verificationNotes: activationNotes || 'Seller activated by admin'
      });

      // Update user account status
      await db.UserTable.update(
        { accountStatus: 'active' },
        { where: { id: seller.userId } }
      );

      res.json({
        success: true,
        message: 'Seller activated successfully',
        data: seller
      });

    } catch (error) {
      console.error('Error activating seller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete seller
  async deleteSeller(req, res) {
    try {
      const { id } = req.params;

      const seller = await db.SellersTable.findByPk(id);
      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      // Check if seller has products
      const productCount = await db.Product.count({
        where: { sellerId: seller.userId }
      });

      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete seller with ${productCount} products. Please remove products first.`
        });
      }

      // Delete seller
      await seller.destroy();

      res.json({
        success: true,
        message: 'Seller deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting seller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Search sellers
  async searchSellers(req, res) {
    try {
      const { query, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const sellers = await db.SellersTable.findAndCountAll({
        where: {
          [Op.or]: [
            { businessName: { [Op.like]: `%${query}%` } },
            { fullName: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } },
            { country: { [Op.like]: `%${query}%` } },
            { state: { [Op.like]: `%${query}%` } }
          ]
        },
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'username', 'email', 'accountStatus']
          },
          {
            model: db.SellerDocument,
            as: 'documents',
            required: false,  // Ensure documents are included even if seller has none
            attributes: [
              'id', 
              'documentType', 
              'documentNumber',  // Document number for ID cards
              'status', 
              'submittedAt', 
              'documentImage',  // Front image
              'documentBackImage'  // Back image for ID cards
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map sellers to include category from selectedCategories
      const sellersWithCategory = sellers.rows.map(seller => {
        const sellerData = seller.toJSON();
        // Get first category from selectedCategories array if category field is empty
        if (!sellerData.category && sellerData.selectedCategories && Array.isArray(sellerData.selectedCategories) && sellerData.selectedCategories.length > 0) {
          sellerData.category = sellerData.selectedCategories[0];
        }
        return sellerData;
      });

      res.json({
        success: true,
        data: {
          sellers: sellersWithCategory,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(sellers.count / limit),
            totalItems: sellers.count,
            itemsPerPage: parseInt(limit)
          },
          searchQuery: query
        }
      });

    } catch (error) {
      console.error('Error searching sellers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get seller statistics
  async getSellerStats(req, res) {
    try {
      const stats = await db.SellersTable.findAll({
        attributes: [
          'verificationStatus',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['verificationStatus']
      });

      const totalSellers = await db.SellersTable.count();
      const pendingDocuments = await db.SellerDocument.count({
        where: { status: 'pending' }
      });

      const recentSellers = await db.SellersTable.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      res.json({
        success: true,
        data: {
          totalSellers,
          pendingDocuments,
          recentSellers,
          statusBreakdown: stats,
          summary: {
            pending: stats.find(s => s.verificationStatus === 'pending')?.count || 0,
            approved: stats.find(s => s.verificationStatus === 'approved')?.count || 0,
            rejected: stats.find(s => s.verificationStatus === 'rejected')?.count || 0,
            suspended: stats.find(s => s.verificationStatus === 'suspended')?.count || 0,
            active: stats.find(s => s.verificationStatus === 'active')?.count || 0
          }
        }
      });

    } catch (error) {
      console.error('Error getting seller stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get top sellers by conversation/message count
  async getTopSellers(req, res) {
    try {
      const { limit = 3 } = req.query;

      // Get all approved sellers
      const sellers = await db.SellersTable.findAll({
        where: { verificationStatus: 'approved' },
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'username', 'profilePicture', 'email']
          }
        ]
      });

      // Count conversations for each seller (via ConversationParticipant)
      const sellersWithCounts = await Promise.all(
        sellers.map(async (seller) => {
          // Count active conversation participants for this seller's userId
          // Join with Conversation to ensure conversation is also active
          const conversationCount = await db.sequelize.query(
            `SELECT COUNT(DISTINCT cp.conversationId) as count
             FROM conversationparticipants cp
             INNER JOIN conversations c ON cp.conversationId = c.id
             WHERE cp.userId = :userId 
             AND cp.isActive = true 
             AND c.isActive = true`,
            {
              replacements: { userId: seller.userId },
              type: db.sequelize.QueryTypes.SELECT
            }
          );

          const count = conversationCount[0]?.count || 0;

          return {
            seller: seller,
            conversationCount: parseInt(count)
          };
        })
      );

      // Sort by conversation count and get top N
      const topSellers = sellersWithCounts
        .sort((a, b) => b.conversationCount - a.conversationCount)
        .slice(0, parseInt(limit))
        .map(item => {
          const sellerData = item.seller.toJSON();
          // Get first category from selectedCategories array if category field is empty
          if (!sellerData.category && sellerData.selectedCategories && Array.isArray(sellerData.selectedCategories) && sellerData.selectedCategories.length > 0) {
            sellerData.category = sellerData.selectedCategories[0];
          }
          return {
            ...sellerData,
            conversationCount: item.conversationCount
          };
        });

      res.json({
        success: true,
        data: {
          sellers: topSellers
        }
      });

    } catch (error) {
      console.error('Error getting top sellers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new SellerManagementController();
