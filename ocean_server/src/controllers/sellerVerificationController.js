const db = require('../../models');
const { Op } = require('sequelize');

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

      const userId = req.user.id;

      // Validate required fields
      if (!businessName || !businessAddress || !country || !documents || !Array.isArray(documents)) {
        return res.status(400).json({
          success: false,
          message: 'Business name, address, country, and documents are required'
        });
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
          category,
          verificationStatus: 'pending',
          verificationScore: 0,
          documentsSubmitted: documents.length,
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
          category,
          email: req.user.email,
          phoneNumber: req.user.phone || '',
          verificationStatus: 'pending',
          verificationScore: 0,
          documentsSubmitted: documents.length,
          documentsApproved: 0,
          lastVerificationCheck: new Date()
        });
      }

      // Process and store documents
      const documentPromises = documents.map(doc => {
        return db.SellerDocument.create({
          sellerId: seller.id,
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          documentImage: doc.documentImage,
          documentBackImage: doc.documentBackImage,
          documentExpiryDate: doc.documentExpiryDate,
          documentIssuingAuthority: doc.documentIssuingAuthority,
          documentCountry: doc.documentCountry,
          status: 'pending',
          documentScore: 0
        });
      });

      await Promise.all(documentPromises);

      // Calculate initial verification score
      const initialScore = await this.calculateVerificationScore(seller.id);
      await seller.update({ verificationScore: initialScore });

      res.status(201).json({
        success: true,
        message: 'Verification application submitted successfully',
        data: {
          sellerId: seller.id,
          verificationScore: initialScore,
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
          attributes: ['id', 'documentType', 'status', 'submittedAt', 'verifiedAt', 'rejectionReason', 'documentScore']
        }]
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller profile not found'
        });
      }

      // Calculate current verification score
      const currentScore = await this.calculateVerificationScore(seller.id);
      if (currentScore !== seller.verificationScore) {
        await seller.update({ verificationScore: currentScore });
      }

      // Get verification benefits
      const benefits = await this.getVerificationBenefits(seller.verificationLevel, seller.verificationScore);

      res.json({
        success: true,
        data: {
          ...seller.toJSON(),
          verificationScore: currentScore,
          benefits,
          nextSteps: this.getNextVerificationSteps(seller)
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
          verificationLevel = this.determineVerificationLevel(seller.verificationScore);
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

      // Recalculate verification score
      const newScore = await this.calculateVerificationScore(seller.id);
      await seller.update({ verificationScore: newScore });

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
          verificationScore: newScore,
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

      // Define verification requirements based on category and country
      const requirements = {
        basic: [
          { type: 'NIN', required: true, description: 'National Identification Number' },
          { type: 'UtilityBill', required: true, description: 'Recent utility bill for address verification' }
        ],
        business: [
          { type: 'BusinessCertificate', required: true, description: 'Business registration certificate' },
          { type: 'TaxCertificate', required: true, description: 'Tax clearance certificate' },
          { type: 'BankStatement', required: true, description: 'Business bank statement (last 3 months)' }
        ],
        premium: [
          { type: 'BusinessLicense', required: true, description: 'Business operating license' },
          { type: 'InsuranceCertificate', required: true, description: 'Business insurance certificate' }
        ]
      };

      // Add country-specific requirements
      if (country === 'Nigeria') {
        requirements.basic.push({
          type: 'DriversLicense',
          required: false,
          description: 'Driver\'s license (alternative to NIN)'
        });
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

      // Document scoring weights
      const documentWeights = {
        'NIN': 25,
        'BusinessCertificate': 30,
        'TaxCertificate': 20,
        'BankStatement': 15,
        'UtilityBill': 10,
        'BusinessLicense': 25,
        'InsuranceCertificate': 20,
        'DriversLicense': 15,
        'Passport': 15
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
          [db.sequelize.fn('AVG', db.sequelize.col('verificationScore')), 'averageScore']
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
