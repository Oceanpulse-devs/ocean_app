const db = require('../../models');
const { Op } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');

class SellerVerificationController {
  // Submit verification application
  async submitVerification(req, res) {
    try {
      const {
        businessName,
        businessAddress,
        country,
        state,
        category,
        documents
      } = req.body;

      // Parse documents if it's a JSON string (form-data)
      let parsedDocuments = documents;
      if (typeof documents === 'string') {
        try {
          parsedDocuments = JSON.parse(documents);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Invalid documents format. Must be valid JSON array.'
          });
        }
      }

      // Check if user already has a pending verification
      const existingSeller = await db.SellersTable.findOne({
        where: { userId: req.user.id }
      });

      if (existingSeller && existingSeller.verificationStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending verification application. Please wait for the result before submitting again.'
        });
      }

      // Debug logging
      console.log('Received documents:', documents);
      console.log('Parsed documents:', parsedDocuments);
      console.log('Files received:', req.files ? req.files.length : 0);

      const userId = req.user.id;

      // Validate required fields with specific error messages
      if (!businessName) {
        return res.status(400).json({
          success: false,
          message: 'Business name is required'
        });
      }

      if (!businessAddress) {
        return res.status(400).json({
          success: false,
          message: 'Business address is required'
        });
      }

      if (!country) {
        return res.status(400).json({
          success: false,
          message: 'Country is required'
        });
      }

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Business category is required'
        });
      }

      // Validate and get category UUID
      const { ProductCategory } = require('../../models');
      let categoryRecord;
      if (category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // UUID format
        categoryRecord = await ProductCategory.findByPk(category);
      } else {
        // Name format - find by name
        categoryRecord = await ProductCategory.findOne({ 
          where: { 
            name: category,
            isActive: true 
          } 
        });
      }

      if (!categoryRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid business category. Please select a valid category from the list.'
        });
      }

      if (!parsedDocuments || !Array.isArray(parsedDocuments) || parsedDocuments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one document is required'
        });
      }

      // First, process files and add image URLs to documents that need them
      let fileIndex = 0;
      
      console.log('Documents needing images:', parsedDocuments.filter(doc => 
        doc.documentType === 'ElectricBill' || doc.documentType === 'IDCard'
      ).length);
      console.log('Files available:', req.files ? req.files.length : 0);

      // Process files and add image URLs to documents
      for (let i = 0; i < parsedDocuments.length; i++) {
        const doc = parsedDocuments[i];
        
        if (doc.documentType === 'ElectricBill' || doc.documentType === 'IDCard') {
          if (req.files && req.files[fileIndex]) {
            const file = req.files[fileIndex];
            console.log(`✅ Processing file ${fileIndex} (${file.originalname}) for ${doc.documentType}`);
            
            // Upload to Cloudinary
            const uploadResult = await cloudinaryService.uploadSellerDocument(
              file.buffer, 
              'temp-seller-id', // We'll update this later with actual seller ID
              doc.documentType
            );
            
            if (uploadResult.success) {
              doc.documentImage = uploadResult.url;
              console.log(`✅ Added image URL to ${doc.documentType}`);
            } else {
              throw new Error(`Failed to upload ${doc.documentType} document: ${uploadResult.error}`);
            }
            fileIndex++;
          } else {
            console.log(`❌ No file available for ${doc.documentType}`);
          }
        }
      }

      // Now validate each document has required fields based on type
      for (let i = 0; i < parsedDocuments.length; i++) {
        const doc = parsedDocuments[i];
        if (!doc.documentType) {
        return res.status(400).json({
          success: false,
            message: `Document ${i + 1}: Document type is required`
          });
        }

        // Simplified validation based on document type
        if (doc.documentType === 'NIN') {
          // NIN only needs the number, no image required
          if (!doc.documentNumber) {
            return res.status(400).json({
              success: false,
              message: `Document ${i + 1}: NIN number is required`
            });
          }
        } else if (doc.documentType === 'ElectricBill') {
          // Electric bill only needs the image, no number required
          if (!doc.documentImage) {
            return res.status(400).json({
              success: false,
              message: `Document ${i + 1}: Electric bill image is required`
            });
          }
        } else if (doc.documentType === 'IDCard') {
          // ID card needs both number and image
          if (!doc.documentNumber) {
            return res.status(400).json({
              success: false,
              message: `Document ${i + 1}: ID card number is required`
            });
          }
          if (!doc.documentImage) {
            return res.status(400).json({
              success: false,
              message: `Document ${i + 1}: ID card image is required`
            });
          }
        } else {
          // For other document types, require both
          if (!doc.documentImage) {
            return res.status(400).json({
              success: false,
              message: `Document ${i + 1}: Document image is required`
            });
          }
        }
      }

      // Check if seller already exists
      let seller = await db.SellersTable.findOne({
        where: { userId }
      });

      if (seller) {
        // Update existing seller
        await seller.update({
          businessName,
          businessAddress,
          country,
          state,
          category: categoryRecord.id, // Use UUID instead of string
          verificationStatus: 'pending',
          documentsSubmitted: parsedDocuments.length,
          documentsApproved: 0,
          lastVerificationCheck: new Date()
        });
      } else {
        // Create new seller
        seller = await db.SellersTable.create({
          userId,
          fullName: req.user.firstName + ' ' + req.user.lastName,
          businessName,
          businessAddress,
          country,
          state,
          category: categoryRecord.id, // Use UUID instead of string
          email: req.user.email,
          phoneNumber: req.user.phone || '',
          verificationStatus: 'pending',
          documentsSubmitted: parsedDocuments.length,
          documentsApproved: 0,
          lastVerificationCheck: new Date()
        });
      }

      // Process and store documents (files already processed above)
      const documentPromises = parsedDocuments.map(async (doc) => {
        console.log(`Creating document: ${doc.documentType} with image: ${doc.documentImage ? 'Yes' : 'No'}`);

        const documentData = {
          sellerId: seller.id,
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          documentImage: doc.documentImage, // Already processed above
          status: 'pending'
        };

        return db.SellerDocument.create(documentData);
      });

      await Promise.all(documentPromises);

      res.status(201).json({
        success: true,
        message: 'Verification application submitted successfully',
        data: {
          sellerId: seller.id,
          status: 'pending'
        }
      });
    } catch (error) {
      console.error('Error submitting verification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit verification application',
        error: error.message
      });
    }
  }

  // Get verification status for seller
  async getVerificationStatus(req, res) {
    try {
      const userId = req.user.id;

      const seller = await db.SellersTable.findOne({
        where: { userId },
        include: [{
          model: db.SellerDocument,
          as: 'documents',
          attributes: ['id', 'documentType', 'status', 'submittedAt', 'verifiedAt']
        }]
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller profile not found'
        });
      }

      // Skip verification score calculation - column doesn't exist

      // Get verification benefits (simplified)
      const benefits = {
        basic: [
          'Verified seller badge',
          'Enhanced product visibility',
          'Access to basic analytics',
          'Priority customer support'
        ]
      };

      res.json({
        success: true,
        data: {
          ...seller.toJSON(),
          benefits,
          nextSteps: ['Wait for admin review', 'Check verification status regularly']
        }
      });
    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get verification status',
        error: error.message
      });
    }
  }

  // Admin: Review verification application
  async reviewVerification(req, res) {
    try {
      const { sellerId, action, notes, documentReviews } = req.body;
      const adminId = req.user.id;

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const seller = await db.SellersTable.findOne({
        where: { id: sellerId },
        include: [{
          model: db.SellerDocument,
          as: 'documents'
        }]
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      let newStatus, verificationLevel, verificationExpiresAt;

      switch (action) {
        case 'approve':
          newStatus = 'approved';
          verificationLevel = this.determineVerificationLevel(0);
          verificationExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
          
          // Update seller status
          await seller.update({
            verificationStatus: newStatus,
            verifiedAt: new Date(),
            isVerified: true,
            verificationLevel,
            verificationExpiresAt,
            verificationNotes: notes,
            lastVerificationCheck: new Date()
          });

          // Update user account type
          await db.UserTable.update({
            accountType: 'seller'
          }, { where: { id: seller.userId } });
          break;

        case 'reject':
          newStatus = 'rejected';
          await seller.update({
            verificationStatus: newStatus,
            rejectionReason: notes,
            lastVerificationCheck: new Date()
          });
          break;

        case 'suspend':
          newStatus = 'suspended';
          await seller.update({
            verificationStatus: newStatus,
            verificationNotes: notes,
            lastVerificationCheck: new Date()
          });
          break;

        case 'request_more_info':
          newStatus = 'pending';
          await seller.update({
            verificationStatus: newStatus,
            verificationNotes: notes,
            lastVerificationCheck: new Date()
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: approve, reject, suspend, or request_more_info'
          });
      }

      // Process document reviews if provided
      if (documentReviews && Array.isArray(documentReviews)) {
        for (const review of documentReviews) {
          await db.SellerDocument.update({
            status: review.status,
            verificationNotes: review.notes,
            verifiedBy: adminId,
            verifiedAt: new Date()
          }, { where: { id: review.documentId } });
        }
      }

      // Skip verification score calculation - column doesn't exist

      // Update document counts
      const approvedDocs = await db.SellerDocument.count({
        where: { sellerId, status: 'approved' }
      });
      await seller.update({ documentsApproved: approvedDocs });

      res.json({
        success: true,
        message: `Verification ${action}ed successfully`,
        data: {
          sellerId,
          newStatus,
          verificationLevel: seller.verificationLevel
        }
      });
    } catch (error) {
      console.error('Error reviewing verification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review verification',
        error: error.message
      });
    }
  }

  // Get verification requirements
  async getVerificationRequirements(req, res) {
    try {
      const { category, country } = req.query;

      // Simplified verification requirements based on country
      let requirements = [];
      
      if (country === 'Nigeria') {
        // For Nigerians: NIN + Electric Bill
        requirements = [
          { 
            type: 'NIN', 
            required: true, 
            description: 'National Identification Number (NIN) - Just the number, no picture needed',
            example: '12345678901',
            fields: ['documentNumber']
          },
          { 
            type: 'ElectricBill', 
            required: true, 
            description: 'Recent electric bill receipt (last 3 months) - Just the picture',
            example: 'Upload clear photo of your electric bill',
            fields: ['documentImage']
          }
        ];
      } else {
        // For Non-Nigerians: ID Card + Electric Bill
        requirements = [
          { 
            type: 'IDCard', 
            required: true, 
            description: 'Valid government-issued ID card (Passport, Driver\'s License, etc.)',
            example: 'Upload clear photo of your ID card',
            fields: ['documentNumber', 'documentImage']
          },
          { 
            type: 'ElectricBill', 
            required: true, 
            description: 'Recent electric bill receipt (last 3 months) - Just the picture',
            example: 'Upload clear photo of your electric bill',
            fields: ['documentImage']
          }
        ];
      }

      res.json({
        success: true,
        data: {
          requirements,
          minimumScore: 70,
          processingTime: '5-7 business days',
          nextSteps: [
            'Submit required documents',
            'Wait for admin review',
            'Receive verification decision',
            'Access verified seller benefits'
          ]
        }
      });
    } catch (error) {
      console.error('Error getting verification requirements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get verification requirements',
        error: error.message
      });
    }
  }

  // Calculate verification score
  async calculateVerificationScore(sellerId) {
    try {
      const documents = await db.SellerDocument.findAll({
        where: { sellerId }
      });

      let totalScore = 0;
      let maxPossibleScore = 0;

      // Simplified document scoring weights
      const documentWeights = {
        'NIN': 50,           // 50% for NIN (Nigerians)
        'IDCard': 50,        // 50% for ID Card (Non-Nigerians)
        'ElectricBill': 50    // 50% for Electric Bill (Both)
      };

      documents.forEach(doc => {
        const weight = documentWeights[doc.documentType] || 10;
        maxPossibleScore += weight;

        switch (doc.status) {
          case 'approved':
            totalScore += weight;
            break;
          case 'pending':
            totalScore += weight * 0.3; // Partial credit for pending
            break;
          case 'rejected':
            totalScore += 0; // No credit for rejected
            break;
          case 'expired':
            totalScore += weight * 0.1; // Minimal credit for expired
            break;
        }
      });

      // Calculate percentage score
      const score = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
      return Math.min(score, 100); // Cap at 100
    } catch (error) {
      console.error('Error calculating verification score:', error);
      return 0;
    }
  }

  // Determine verification level based on score
  determineVerificationLevel(score) {
    if (score >= 90) return 'enterprise';
    if (score >= 80) return 'premium';
    return 'basic';
  }

  // Get verification benefits
  async getVerificationBenefits(level, score) {
    const benefits = {
      basic: [
        'Verified seller badge',
        'Enhanced product visibility',
        'Access to basic analytics',
        'Priority customer support'
      ],
      premium: [
        'All basic benefits',
        'Premium placement in search results',
        'Advanced analytics dashboard',
        'Featured seller opportunities',
        'Access to buyer needs board'
      ],
      enterprise: [
        'All premium benefits',
        'Top placement in all listings',
        'Dedicated account manager',
        'Custom reporting tools',
        'Exclusive marketplace features',
        'API access for bulk operations'
      ]
    };

    return benefits[level] || benefits.basic;
  }

  // Get next verification steps
  getNextVerificationSteps(seller) {
    const steps = [];

    if (seller.verificationStatus === 'pending') {
      if (seller.documentsSubmitted < 3) {
        steps.push('Submit additional required documents');
      }
      steps.push('Wait for admin review (5-7 business days)');
    } else if (seller.verificationStatus === 'rejected') {
      steps.push('Review rejection reason');
      steps.push('Submit corrected documents');
      steps.push('Resubmit verification application');
    } else if (seller.verificationStatus === 'approved') {
      if (seller.verificationExpiresAt && new Date() > seller.verificationExpiresAt) {
        steps.push('Renew verification (expired)');
      } else {
        steps.push('Verification active - enjoy verified seller benefits!');
      }
    }

    return steps;
  }

  // Get verification statistics
  async getVerificationStats(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

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

      const avgVerificationScore = await db.SellersTable.findOne({
        attributes: [
          [db.sequelize.literal('0'), 'averageScore']
        ]
      });

      res.json({
        success: true,
        data: {
          statusBreakdown: stats,
          totalSellers,
          pendingDocuments,
          averageVerificationScore: Math.round(avgVerificationScore?.dataValues?.averageScore || 0)
        }
      });
    } catch (error) {
      console.error('Error getting verification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get verification statistics',
        error: error.message
      });
    }
  }
}

module.exports = new SellerVerificationController();
