const db = require('../../models');
const { Op } = require('sequelize');

class HeavyDistributorController {
  // Create a new heavy distributor listing
  async createDistributor(req, res) {
    try {
      const {
        businessName,
        businessType,
        productCategories,
        productBrands,
        minimumOrderQuantity,
        minimumOrderValue,
        paymentTerms,
        deliveryOptions,
        coverageAreas,
        contactInfo,
        businessAddress,
        operatingHours,
        certifications,
        yearsInBusiness,
        employeeCount,
        annualRevenue
      } = req.body;

      const userId = req.user.id;

      // Debug: Log the received data
      console.log('Received distributor data:', {
        businessName,
        businessType,
        productCategories,
        coverageAreas,
        contactInfo,
        businessAddress,
        userId
      });

      // Check if user has an approved seller profile
      const sellerProfile = await db.SellersTable.findOne({
        where: { userId: userId }
      });

      if (!sellerProfile) {
        return res.status(400).json({
          success: false,
          message: 'You must first apply and be approved as a seller before becoming a heavy distributor'
        });
      }

      if (sellerProfile.verificationStatus !== 'verified') {
        return res.status(400).json({
          success: false,
          message: 'Your seller account must be verified before you can become a heavy distributor'
        });
      }

      const supplierId = sellerProfile.id;

      // Validate required fields with specific error messages
      if (!businessName) {
        return res.status(400).json({
          success: false,
          message: 'Business name is required'
        });
      }

      if (!businessType) {
        return res.status(400).json({
          success: false,
          message: 'Business type is required'
        });
      }

      if (!productCategories) {
        return res.status(400).json({
          success: false,
          message: 'Product categories are required'
        });
      }

      if (!coverageAreas) {
        return res.status(400).json({
          success: false,
          message: 'Coverage areas are required'
        });
      }

      // Validate that arrays are not empty
      if (Array.isArray(productCategories) && productCategories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product category is required'
        });
      }

      if (Array.isArray(coverageAreas) && coverageAreas.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one coverage area is required'
        });
      }

      // Validate contact info structure if provided
      if (contactInfo && typeof contactInfo === 'object') {
        if (!contactInfo.phone && !contactInfo.email) {
          return res.status(400).json({
            success: false,
            message: 'Contact info must include at least phone or email'
          });
        }
      }

      // Validate business address structure if provided
      if (businessAddress && typeof businessAddress === 'object') {
        if (!businessAddress.street && !businessAddress.city) {
          return res.status(400).json({
            success: false,
            message: 'Business address must include at least street or city'
          });
        }
      }

      // Check if supplier already has a distributor listing
      const existingListing = await db.HeavyDistributor.findOne({
        where: { supplierId }
      });

      if (existingListing) {
        return res.status(400).json({
          success: false,
          message: 'You already have a distributor listing. You can only have one listing per supplier account.'
        });
      }

      // Create the distributor listing
      const distributor = await db.HeavyDistributor.create({
        supplierId,
        businessName,
        businessType,
        productCategories,
        productBrands,
        minimumOrderQuantity,
        minimumOrderValue,
        paymentTerms,
        deliveryOptions,
        coverageAreas,
        contactInfo,
        businessAddress,
        operatingHours,
        certifications,
        yearsInBusiness,
        employeeCount,
        annualRevenue,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Heavy distributor listing created successfully',
        data: distributor
      });
    } catch (error) {
      console.error('Error creating heavy distributor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create heavy distributor listing',
        error: error.message
      });
    }
  }

  // Get all distributors with advanced search and filtering
  async getAllDistributors(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        businessType,
        productCategory,
        productBrand,
        location,
        minRating,
        isVerified,
        sortBy = 'rating',
        sortOrder = 'DESC',
        searchQuery
      } = req.query;

      const offset = (page - 1) * limit;

      // Build filter conditions
      const whereClause = {
        status: 'active',
        isActive: true
      };

      if (businessType) {
        whereClause.businessType = businessType;
      }

      if (isVerified !== undefined) {
        whereClause.isVerified = isVerified === 'true';
      }

      if (minRating) {
        whereClause.rating = {
          [Op.gte]: parseFloat(minRating)
        };
      }

      if (location) {
        whereClause.coverageAreas = {
          [Op.like]: `%${location}%`
        };
      }

      // Build search conditions
      let searchConditions = [];
      if (searchQuery) {
        searchConditions = [
          { businessName: { [Op.like]: `%${searchQuery}%` } },
          { businessAddress: { [Op.like]: `%${searchQuery}%` } },
          { productCategories: { [Op.like]: `%${searchQuery}%` } },
          { productBrands: { [Op.like]: `%${searchQuery}%` } }
        ];
      }

      if (productCategory) {
        searchConditions.push({
          productCategories: { [Op.like]: `%${productCategory}%` }
        });
      }

      if (productBrand) {
        searchConditions.push({
          productBrands: { [Op.like]: `%${productBrand}%` }
        });
      }

      if (searchConditions.length > 0) {
        whereClause[Op.or] = searchConditions;
      }

      // Get distributors with pagination and sorting
      const { count, rows: distributors } = await db.HeavyDistributor.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.SellersTable,
            as: 'supplier',
            attributes: ['id', 'businessName', 'verificationStatus', 'businessAddress']
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate total pages
      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: distributors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching distributors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distributors',
        error: error.message
      });
    }
  }

  // Get distributor by ID with detailed information
  async getDistributorById(req, res) {
    try {
      const { id } = req.params;

      const distributor = await db.HeavyDistributor.findOne({
        where: {
          id,
          status: 'active',
          isActive: true
        },
        include: [
          {
            model: db.SellersTable,
            as: 'supplier',
            attributes: ['id', 'businessName', 'verificationStatus', 'businessAddress', 'phone', 'email']
          }
        ]
      });

      if (!distributor) {
        return res.status(404).json({
          success: false,
          message: 'Distributor not found'
        });
      }

      // Get recent reviews
      const reviews = await db.DistributorReview.findAll({
        where: {
          distributorId: id,
          status: 'approved'
        },
        include: [
          {
            model: db.UserTable,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName', 'profilePicture']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      // Update last activity
      await distributor.update({ lastActivity: new Date() });

      res.json({
        success: true,
        data: {
          ...distributor.toJSON(),
          recentReviews: reviews
        }
      });
    } catch (error) {
      console.error('Error fetching distributor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distributor',
        error: error.message
      });
    }
  }

  // Update distributor listing
  async updateDistributor(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const supplierId = req.user.id;

      // Find the distributor listing
      const distributor = await db.HeavyDistributor.findOne({
        where: {
          id,
          supplierId
        }
      });

      if (!distributor) {
        return res.status(404).json({
          success: false,
          message: 'Distributor listing not found or you are not authorized to update it'
        });
      }

      // Update the listing
      await distributor.update(updateData);

      res.json({
        success: true,
        message: 'Distributor listing updated successfully',
        data: distributor
      });
    } catch (error) {
      console.error('Error updating distributor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update distributor listing',
        error: error.message
      });
    }
  }

  // Delete distributor listing
  async deleteDistributor(req, res) {
    try {
      const { id } = req.params;
      const supplierId = req.user.id;

      const distributor = await db.HeavyDistributor.findOne({
        where: {
          id,
          supplierId
        }
      });

      if (!distributor) {
        return res.status(404).json({
          success: false,
          message: 'Distributor listing not found or you are not authorized to delete it'
        });
      }

      // Soft delete by setting status to inactive
      await distributor.update({ 
        status: 'inactive',
        isActive: false
      });

      res.json({
        success: true,
        message: 'Distributor listing deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting distributor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete distributor listing',
        error: error.message
      });
    }
  }

  // Create inquiry to distributor
  async createInquiry(req, res) {
    try {
      const {
        distributorId,
        inquiryType,
        customInquiryType,
        subject,
        message,
        productCategories,
        productBrands,
        quantityNeeded,
        budgetRange,
        urgencyLevel,
        preferredContactMethod,
        preferredContactTime,
        location,
        deliveryRequirements,
        additionalFiles
      } = req.body;

      const inquirerId = req.user.id;

      // Validate required fields
      if (!distributorId || !inquiryType || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Distributor ID, inquiry type, subject, and message are required'
        });
      }

      // Check if distributor exists and is active
      const distributor = await db.HeavyDistributor.findOne({
        where: {
          id: distributorId,
          status: 'active',
          isActive: true
        }
      });

      if (!distributor) {
        return res.status(404).json({
          success: false,
          message: 'Distributor not found or inactive'
        });
      }

      // Create the inquiry
      const inquiry = await db.DistributorInquiry.create({
        inquirerId,
        distributorId,
        inquiryType,
        customInquiryType,
        subject,
        message,
        productCategories,
        productBrands,
        quantityNeeded,
        budgetRange,
        urgencyLevel,
        preferredContactMethod,
        preferredContactTime,
        location,
        deliveryRequirements,
        additionalFiles
      });

      res.status(201).json({
        success: true,
        message: 'Inquiry sent successfully',
        data: inquiry
      });
    } catch (error) {
      console.error('Error creating inquiry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send inquiry',
        error: error.message
      });
    }
  }

  // Get inquiries for a distributor
  async getDistributorInquiries(req, res) {
    try {
      const { distributorId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      // Verify the distributor belongs to the authenticated user
      const distributor = await db.HeavyDistributor.findOne({
        where: {
          id: distributorId,
          supplierId: req.user.id
        }
      });

      if (!distributor) {
        return res.status(404).json({
          success: false,
          message: 'Distributor not found or you are not authorized to view inquiries'
        });
      }

      // Build filter conditions
      const whereClause = { distributorId };
      if (status) {
        whereClause.status = status;
      }

      // Get inquiries with pagination
      const { count, rows: inquiries } = await db.DistributorInquiry.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'inquirer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: inquiries,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inquiries',
        error: error.message
      });
    }
  }

  // Get distributor statistics
  async getDistributorStats(req, res) {
    try {
      const { id } = req.params;

      // Get basic stats
      const basicStats = await db.HeavyDistributor.findOne({
        where: { id },
        attributes: [
          'rating',
          'reviewCount',
          'isVerified',
          'status',
          'createdAt'
        ]
      });

      if (!basicStats) {
        return res.status(404).json({
          success: false,
          message: 'Distributor not found'
        });
      }

      // Get inquiry stats
      const inquiryStats = await db.DistributorInquiry.findAll({
        where: { distributorId: id },
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Get review breakdown
      const reviewStats = await db.DistributorReview.findAll({
        where: { 
          distributorId: id,
          status: 'approved'
        },
        attributes: [
          'rating',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['rating']
      });

      res.json({
        success: true,
        data: {
          basic: basicStats,
          inquiries: inquiryStats,
          reviews: reviewStats
        }
      });
    } catch (error) {
      console.error('Error fetching distributor stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distributor statistics',
        error: error.message
      });
    }
  }

  // Search distributors by location and product
  async searchDistributors(req, res) {
    try {
      const {
        location,
        productCategory,
        productBrand,
        businessType,
        minRating = 0,
        maxDistance = 100
      } = req.query;

      // Location is optional for search - if not provided, search all locations

      // Build search conditions
      const whereClause = {
        status: 'active',
        isActive: true,
        rating: {
          [Op.gte]: parseFloat(minRating)
        }
      };

      if (businessType) {
        whereClause.businessType = businessType;
      }

      // Location-based search (only if location is provided)
      if (location) {
        whereClause.coverageAreas = {
          [Op.like]: `%${location}%`
        };
      }

      // Product-based search
      if (productCategory || productBrand) {
        let productConditions = [];
        
        if (productCategory) {
          productConditions.push({
            productCategories: { [Op.like]: `%${productCategory}%` }
          });
        }
        
        if (productBrand) {
          productConditions.push({
            productBrands: { [Op.like]: `%${productBrand}%` }
          });
        }
        
        whereClause[Op.or] = productConditions;
      }

      // Get matching distributors
      const distributors = await db.HeavyDistributor.findAll({
        where: whereClause,
        include: [
          {
            model: db.SellersTable,
            as: 'supplier',
            attributes: ['id', 'businessName', 'verificationStatus', 'businessAddress']
          }
        ],
        order: [
          ['isVerified', 'DESC'],
          ['rating', 'DESC'],
          ['reviewCount', 'DESC']
        ],
        limit: 50
      });

      res.json({
        success: true,
        data: distributors,
        searchCriteria: {
          location,
          productCategory,
          productBrand,
          businessType,
          minRating,
          maxDistance
        }
      });
    } catch (error) {
      console.error('Error searching distributors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search distributors',
        error: error.message
      });
    }
  }
}

module.exports = new HeavyDistributorController();
