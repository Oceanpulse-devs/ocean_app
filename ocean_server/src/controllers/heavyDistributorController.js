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

  // Get all distributors with advanced search and filtering - DIRECT SEARCH FROM SELLERS TABLE
  async getAllDistributors(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        businessType,
        productCategory,
        productBrand,
        subCategory,
        location,
        minRating,
        isVerified,
        sortBy = 'rating',
        sortOrder = 'DESC',
        searchQuery
      } = req.query;

      console.log('🔍 GET ALL DISTRIBUTORS - Direct Sellers Table Search:');
      console.log('   Business Type:', businessType);
      console.log('   Product Category:', productCategory);
      console.log('   Location:', location);
      console.log('   Min Rating:', minRating);

      const offset = (page - 1) * limit;

      const allowedSellerTypes = ['manufacturer', 'wholesaler', 'distributor', 'retailer'];

      // Build filter conditions for SellersTable
      const whereClause = {
        verificationStatus: 'approved', // Only approved sellers
      };

      // Add business type filter if provided
      if (businessType) {
        const typeMap = {
          'heavy distributor': 'distributor',
          'heavy distributors': 'distributor',
          'manufacturer': 'manufacturer',
          'manufacturers': 'manufacturer',
          'wholesaler': 'wholesaler',
          'wholesalers': 'wholesaler',
          'retailer': 'retailer',
          'retailers': 'retailer',
        };

        const normalizedType = businessType.trim().toLowerCase();
        const mappedSellerType = typeMap[normalizedType] || normalizedType;
        whereClause.sellerType = mappedSellerType;
      } else {
        whereClause.sellerType = {
          [Op.in]: allowedSellerTypes
        };
      }

      // Add location filter if provided
      if (location) {
        whereClause.country = {
          [Op.like]: `%${location}%`
        };
      }

      // Add rating filter if provided
      if (minRating) {
        whereClause.rating = {
          [Op.gte]: parseFloat(minRating)
        };
      }

      // Add product category filter if provided
      if (productCategory) {
        whereClause.selectedCategories = {
          [Op.like]: `%${productCategory}%`
        };
      }

      if (subCategory) {
        whereClause.selectedSubcategories = {
          [Op.like]: `%${subCategory}%`
        };
      }

      // Add search query filter if provided
      if (searchQuery) {
        whereClause[Op.or] = [
          { businessName: { [Op.like]: `%${searchQuery}%` } },
          { businessAddress: { [Op.like]: `%${searchQuery}%` } },
          { selectedCategories: { [Op.like]: `%${searchQuery}%` } }
        ];
      }

      console.log('   Where Clause:', JSON.stringify(whereClause, null, 2));

      // Get sellers with pagination and sorting
      const { count, rows: sellers } = await db.SellersTable.findAndCountAll({
        where: whereClause,
        attributes: [
          'id',
          'userId',
          'businessName',
          'businessAddress',
          'country',
          'sellerType',
          'selectedCategories',
          'selectedSubcategories',
          'businessEmail',
          'businessPhone',
          'rating',
          'totalSales',
          'verificationStatus',
          'createdAt',
          'updatedAt'
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      console.log('✅ Found', sellers.length, 'sellers matching criteria');

      // Transform sellers data to match HeavyDistributor format
      const distributors = sellers.map(seller => ({
        id: seller.id,
        supplierId: seller.userId,
        businessName: seller.businessName,
        businessType: seller.sellerType,
        productCategories: seller.selectedCategories || [],
        productBrands: [], // Not available in sellers table
        coverageAreas: [seller.country], // Use country as coverage area
        businessAddress: seller.businessAddress,
        contactInfo: {
          email: seller.businessEmail,
          phone: seller.businessPhone
        },
        isVerified: seller.verificationStatus === 'approved',
        rating: seller.rating || 0,
        reviewCount: 0, // Not available in sellers table
        status: 'active',
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
        lastActivity: seller.updatedAt
      }));

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

  // Search distributors by location and product - DIRECT SEARCH FROM SELLERS TABLE
  async searchDistributors(req, res) {
    try {
      const {
        location,
        productCategory,
        productBrand,
        subCategory,
        businessType,
        minRating = 0,
        maxDistance = 100
      } = req.query;

      console.log('🔍 SEARCH DISTRIBUTORS - Direct Sellers Table Search:');
      console.log('   Location:', location);
      console.log('   Product Category:', productCategory);
      console.log('   Business Type:', businessType);
      console.log('   Min Rating:', minRating);

      // Build search conditions for SellersTable
      const whereClause = {
        verificationStatus: 'approved', // Only approved sellers
        sellerType: {
          [Op.in]: ['manufacturer', 'wholesaler', 'distributor'] // Only distributor types
        }
      };

      // Add business type filter if provided
      if (businessType) {
        // Map frontend business types to backend seller types
        let mappedSellerType = businessType.toLowerCase();
        if (mappedSellerType === 'heavy distributor') {
          mappedSellerType = 'distributor';
        }
        whereClause.sellerType = mappedSellerType;
      }

      // Add location filter if provided
      if (location) {
        whereClause.country = {
          [Op.like]: `%${location}%`
        };
      }

      // Add rating filter if provided
      if (minRating > 0) {
        whereClause.rating = {
          [Op.gte]: parseFloat(minRating)
        };
      }

      // Add product category filter if provided
      if (productCategory) {
        whereClause.selectedCategories = {
          [Op.like]: `%${productCategory}%`
        };
      }

      if (subCategory) {
        whereClause.selectedSubcategories = {
          [Op.like]: `%${subCategory}%`
        };
      }

      console.log('   Where Clause:', JSON.stringify(whereClause, null, 2));

      // Search directly from SellersTable
      const sellers = await db.SellersTable.findAll({
        where: whereClause,
        attributes: [
          'id',
          'userId',
          'businessName',
          'businessAddress',
          'country',
          'sellerType',
          'selectedCategories',
          'selectedSubcategories',
          'businessEmail',
          'businessPhone',
          'rating',
          'totalSales',
          'verificationStatus',
          'createdAt',
          'updatedAt'
        ],
        order: [
          ['rating', 'DESC'],
          ['totalSales', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: 50
      });

      console.log('✅ Found', sellers.length, 'sellers matching criteria');

      // Transform sellers data to match HeavyDistributor format for frontend compatibility
      const distributors = sellers.map(seller => ({
        id: seller.id,
        supplierId: seller.userId,
        businessName: seller.businessName,
        businessType: seller.sellerType,
        productCategories: seller.selectedCategories || [],
        productBrands: [], // Not available in sellers table
        coverageAreas: [seller.country], // Use country as coverage area
        businessAddress: seller.businessAddress,
        contactInfo: {
          email: seller.businessEmail,
          phone: seller.businessPhone
        },
        isVerified: seller.verificationStatus === 'approved',
        rating: seller.rating || 0,
        reviewCount: 0, // Not available in sellers table
        status: 'active',
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
        lastActivity: seller.updatedAt
      }));

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
