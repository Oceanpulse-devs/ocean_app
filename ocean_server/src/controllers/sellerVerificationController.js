const db = require('../../models');
const { Op } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');
const dojahService = require('../services/dojahService');

// Automatically ensure seller_verification_logs table exists
const ensureSellerVerificationLogTableExists = async () => {
  try {
    if (db.SellerVerificationLog) {
      await db.SellerVerificationLog.sync({ alter: false });
    }
  } catch (err) {
    console.warn('⚠️ Could not sync seller_verification_logs table:', err.message);
  }
};
ensureSellerVerificationLogTableExists();

class SellerVerificationController {
  // Submit verification application
  async submitVerification(req, res) {
    try {
      const {
        businessName,
        businessAddress,
        businessDescription,
        sellerTypes, // Array of seller types from Flutter
        selectedCategories, // Array of main categories from Flutter
        selectedSubcategories, // Object mapping categories to subcategories from Flutter
        businessEmail,
        businessPhone,
        country,
        state,
        documents
      } = req.body;

      // Handle file uploads from Flutter form
      const businessDocumentFile = req.files?.businessDocument;
      const personalIdFile = req.files?.personalId;

      // Create documents array from Flutter form files
      let parsedDocuments = [];
      
      // Add business document if provided
      if (businessDocumentFile && businessDocumentFile[0]) {
        parsedDocuments.push({
          documentType: 'BusinessLicense', // Default type, can be customized
          documentNumber: '', // Optional
          documentImage: null // Will be set after upload
        });
      }
      
      // Add personal ID document if provided
      if (personalIdFile && personalIdFile[0]) {
        parsedDocuments.push({
          documentType: 'IDCard', // Default type, can be customized
          documentNumber: '', // Optional
          documentImage: null // Will be set after upload
        });
      }

      // If documents array is provided in body, use that instead
      if (documents) {
        if (typeof documents === 'string') {
          try {
            parsedDocuments = JSON.parse(documents);
          } catch (error) {
            return res.status(400).json({
              success: false,
              message: 'Invalid documents format. Must be valid JSON array.'
            });
          }
        } else {
          parsedDocuments = documents;
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

      // Parse selectedSubcategories if it's a JSON string
      let parsedSubcategories = selectedSubcategories;
      if (typeof selectedSubcategories === 'string') {
        try {
          parsedSubcategories = JSON.parse(selectedSubcategories);
        } catch (error) {
          console.error('Error parsing selectedSubcategories:', error);
          parsedSubcategories = {};
        }
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

      if (!businessDescription) {
        return res.status(400).json({
          success: false,
          message: 'Business description is required'
        });
      }

      if (!country) {
        return res.status(400).json({
          success: false,
          message: 'Country is required'
        });
      }

      // Validate seller types (array from Flutter)
      if (!sellerTypes || !Array.isArray(sellerTypes) || sellerTypes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please select at least one seller type. You can select multiple types if applicable to your business.'
        });
      }

      const validSellerTypes = ['retailer', 'wholesaler', 'distributor', 'manufacturer'];
      for (const type of sellerTypes) {
        if (!validSellerTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid seller type: ${type}. Must be one of: ${validSellerTypes.join(', ')}`
          });
        }
      }

      // Validate selected categories (array from Flutter)
      if (!selectedCategories || !Array.isArray(selectedCategories) || selectedCategories.length === 0 || selectedCategories.length > 3) {
        return res.status(400).json({
          success: false,
          message: 'You must select 1-3 main categories'
        });
      }

      // Validate business email if provided
      if (businessEmail && !businessEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid business email format'
        });
      }

      // Validate business phone if provided
      if (businessPhone && businessPhone.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Business phone number must be at least 10 characters long'
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
        doc.documentType === 'BusinessLicense' || doc.documentType === 'IDCard'
      ).length);
      console.log('Files available:', req.files ? Object.keys(req.files).length : 0);

      // Process files and add image URLs to documents
      for (let i = 0; i < parsedDocuments.length; i++) {
        const doc = parsedDocuments[i];
        
        if (doc.documentType === 'BusinessLicense' || doc.documentType === 'IDCard') {
          let file = null;
          
          // Get the appropriate file based on document type
          if (doc.documentType === 'BusinessLicense' && businessDocumentFile && businessDocumentFile[0]) {
            file = businessDocumentFile[0];
          } else if (doc.documentType === 'IDCard' && personalIdFile && personalIdFile[0]) {
            file = personalIdFile[0];
          }
          
          if (file) {
            console.log(`✅ Processing file (${file.originalname}) for ${doc.documentType}`);
            
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
          } else {
            console.log(`❌ No file available for ${doc.documentType}`);
          }
        }
      }

      // Validate that ID Card is COMPULSORY (required)
      const hasIDCard = parsedDocuments.some(doc => doc.documentType === 'IDCard');
      if (!hasIDCard) {
        return res.status(400).json({
          success: false,
          message: 'ID Card is required. Please upload your ID Card document.'
        });
      }

      // Business License is optional - no validation needed

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
        if (doc.documentType === 'BusinessLicense') {
          // Business license needs the image
          if (!doc.documentImage) {
            return res.status(400).json({
              success: false,
              message: `Document ${i + 1}: Business license image is required`
            });
          }
        } else if (doc.documentType === 'IDCard') {
          // ID card is COMPULSORY - only requires image (number is optional)
          if (!doc.documentImage) {
            return res.status(400).json({
              success: false,
              message: `Document ${i + 1}: ID card image is required`
            });
          }
        } else {
          // For other document types, require image
          if (!doc.documentImage) {
            return res.status(400).json({
              success: false,
              message: `Document ${i + 1}: Document image is required`
            });
          }
        }
      }

      // Get user's full name from UserTable
      const user = await db.UserTable.findByPk(userId);
      const userFullName = user?.fullName || 'Unknown User';

      // Update user's businessName in UserTable
      await user.update({
        businessName: businessName
      });

      // Check if seller already exists
      let seller = await db.SellersTable.findOne({
        where: { userId }
      });

      if (seller) {
        // Update existing seller
        await seller.update({
          fullName: userFullName, // Update full name from UserTable
          businessName,
          businessAddress,
          businessDescription,
          country,
          state: state !== undefined ? state : seller.state, // Update state if provided
          sellerType: sellerTypes[0], // Use first seller type as primary
          selectedCategories: selectedCategories, // Store as JSON array
          selectedSubcategories: parsedSubcategories || {}, // Store as JSON object (parsed)
          businessEmail: businessEmail,
          businessPhone: businessPhone,
          phoneNumber: businessPhone || '', // Use business phone if provided, otherwise empty string
          verificationStatus: 'pending',
          documentsSubmitted: parsedDocuments.length,
          documentsApproved: 0,
          lastVerificationCheck: new Date()
        });
      } else {
        // Create new seller
        seller = await db.SellersTable.create({
          userId,
          fullName: userFullName,
          businessName,
          businessAddress,
          businessDescription,
          country,
          state: state || null, // Store state if provided
          sellerType: sellerTypes[0], // Use first seller type as primary
          selectedCategories: selectedCategories, // Store as JSON array
          selectedSubcategories: parsedSubcategories || {}, // Store as JSON object (parsed)
          businessEmail: businessEmail,
          businessPhone: businessPhone,
          email: businessEmail || req.user.email, // Use business email if provided
          phoneNumber: businessPhone || '', // Use business phone if provided, otherwise empty string
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

  // Verify NIN automatically via Dojah Facial Recognition API & Auto-approve seller
  async verifySellerNinWithDojah(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const {
        nin,
        selfieImage,
        businessName,
        businessAddress,
        businessDescription,
        country = 'Nigeria',
        state = 'Lagos',
        selectedCategories,
        selectedSubcategories
      } = req.body;

      if (!nin) {
        return res.status(400).json({
          success: false,
          message: 'NIN (National Identification Number) is required'
        });
      }

      if (!selfieImage) {
        return res.status(400).json({
          success: false,
          message: 'Selfie image (selfieImage) is required for facial verification'
        });
      }

      const user = await db.UserTable.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      // Check or find existing seller record
      let seller = await db.SellersTable.findOne({ where: { userId } });

      console.log(`🔍 Processing Dojah Biometric Facial Verification for user ${userId} (${user.email})...`);

      // Call Dojah Facial Verification Service (NIN + Selfie Match)
      const dojahRes = await dojahService.verifyNinWithFace(nin, selfieImage);

      // Handle Facial Match Failure or API Error
      if (!dojahRes.success || !dojahRes.faceMatched) {
        const failureMsg = dojahRes.error || 'Face verification failed. The selfie provided does not match the photo on your NIMC record.';

        // Log failed verification attempt in database
        if (db.SellerVerificationLog) {
          await db.SellerVerificationLog.create({
            userId,
            sellerId: seller ? seller.id : null,
            verificationType: 'NIN_FACIAL_DOJAH',
            ninNumber: dojahService.encryptNin(nin),
            confidenceScore: Math.round(dojahRes.confidenceValue || 0),
            status: 'rejected',
            failureReason: failureMsg,
            rawResponse: dojahRes.raw || dojahRes.data || null
          });
        }

        return res.status(dojahRes.statusCode || 400).json({
          success: false,
          message: failureMsg,
          isMock: dojahRes.isMock || false
        });
      }

      const nimcData = dojahRes.data || {};
      const nimcFirstName = nimcData.first_name || '';
      const nimcLastName = nimcData.last_name || '';
      const nimcDob = nimcData.dob || '';
      const nimcPhone = nimcData.mobile || '';
      const nimcState = nimcData.residence_state || '';
      const trackingId = nimcData.tracking_id || `DOJAH-FACE-${Date.now()}`;
      const confidenceScore = Math.round(dojahRes.confidenceValue || 95);

      // 1. Encrypt NIN for secure database storage & Upload selfie to Cloudinary
      const encryptedNin = dojahService.encryptNin(nin);
      const maskedNin = dojahService.maskNin(nin);

      let selfieCloudinaryUrl = nimcData.photo || null;
      if (selfieImage && typeof selfieImage === 'string' && selfieImage !== 'MOCK_SELFIE' && selfieImage !== 'FAIL_FACE') {
        try {
          const uploadRes = await cloudinaryService.uploadFile(selfieImage, 'ocean-app/kyc_selfies');
          if (uploadRes && uploadRes.secure_url) {
            selfieCloudinaryUrl = uploadRes.secure_url;
          }
        } catch (uploadErr) {
          console.warn('⚠️ Cloudinary selfie upload warning:', uploadErr.message);
        }
      }

      // 2. Create Audit Log in SellerVerificationLog
      let logRecord = null;
      if (db.SellerVerificationLog) {
        logRecord = await db.SellerVerificationLog.create({
          userId,
          sellerId: seller ? seller.id : null,
          verificationType: 'NIN_FACIAL_DOJAH',
          ninNumber: encryptedNin,
          nimcFirstName,
          nimcLastName,
          nimcDob,
          nimcPhone,
          nimcState,
          nimcPhotoUrl: selfieCloudinaryUrl,
          dojahReferenceId: trackingId,
          confidenceScore: confidenceScore,
          status: 'approved',
          failureReason: null,
          rawResponse: nimcData
        });
      }

      // 3. Create or Update Seller Record in SellersTable
      if (!seller) {
        seller = await db.SellersTable.create({
          userId,
          fullName: user.fullName || `${nimcFirstName} ${nimcLastName}`.trim() || 'Seller',
          businessName: businessName || `${user.fullName || 'Seller'}'s Store`,
          email: user.email,
          phoneNumber: user.phoneNumber || nimcPhone || 'N/A',
          businessAddress: businessAddress || nimcState || 'Nigeria',
          businessDescription: businessDescription || 'Verified seller on BlueWhale Marketplace',
          country: country || 'Nigeria',
          state: state || nimcState || 'Lagos',
          selectedCategories: selectedCategories || [],
          selectedSubcategories: selectedSubcategories || {},
          isVerified: true,
          verificationStatus: 'approved',
          verifiedAt: new Date(),
          verificationScore: 95,
          verificationLevel: 'basic',
          verificationNotes: `Auto-verified via Dojah Facial Recognition (NIMC Photo Match ${confidenceScore}%, Tracking ID: ${trackingId})`
        });

        if (logRecord) {
          await logRecord.update({ sellerId: seller.id });
        }
      } else {
        await seller.update({
          isVerified: true,
          verificationStatus: 'approved',
          verifiedAt: new Date(),
          verificationScore: 95,
          verificationNotes: `Auto-verified via Dojah Facial Recognition (NIMC Photo Match ${confidenceScore}%, Tracking ID: ${trackingId})`
        });
      }

      // 4. Update UserTable accountStatus & role
      await user.update({
        accountStatus: 'verified',
        role: 'seller'
      });

      // 5. Create or Update SellerDocument record for NIN
      if (db.SellerDocument) {
        const existingDoc = await db.SellerDocument.findOne({
          where: { sellerId: seller.id, documentType: 'NIN' }
        });

        if (!existingDoc) {
          await db.SellerDocument.create({
            sellerId: seller.id,
            documentType: 'NIN',
            documentNumber: maskedNin,
            documentImage: selfieCloudinaryUrl,
            status: 'approved',
            submittedAt: new Date(),
            verifiedAt: new Date(),
            verificationNotes: `Auto-verified via Dojah Facial Recognition (NIMC Photo Match Confidence: ${confidenceScore}%)`
          });
        } else {
          await existingDoc.update({
            documentNumber: maskedNin,
            documentImage: selfieCloudinaryUrl || existingDoc.documentImage,
            status: 'approved',
            verifiedAt: new Date(),
            verificationNotes: `Auto-verified via Dojah Facial Recognition (NIMC Photo Match Confidence: ${confidenceScore}%)`
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'NIN verification successful! Your selfie matched your official NIMC record and your seller account is now fully verified.',
        data: {
          sellerId: seller.id,
          userId: user.id,
          isVerified: true,
          verificationStatus: 'approved',
          confidenceScore: confidenceScore,
          dojahReferenceId: trackingId,
          isMock: dojahRes.isMock || false,
          nimcDetails: {
            firstName: nimcFirstName,
            lastName: nimcLastName,
            state: nimcState
          }
        }
      });
    } catch (error) {
      console.error('Error in verifySellerNinWithDojah:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during automated NIN verification',
        error: error.message
      });
    }
  }
}

module.exports = new SellerVerificationController();
