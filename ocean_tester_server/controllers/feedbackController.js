const { Feedback, SellerTester, BuyerTester } = require('../models');
const { Op } = require('sequelize');

/**
 * Submit feedback (public)
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const {
      name, email, testerId, role,
      deviceType, deviceModel, osVersion,
      issueType, priority, title, description,
      stepsToReproduce, expectedBehavior, actualBehavior,
      rating, screenshotUrl
    } = req.body;

    // Validation
    if (!name || !email || !testerId || !role || !deviceType || 
        !deviceModel || !osVersion || !issueType || !priority || 
        !title || !description || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate tester ID exists (check if tester is registered and selected)
    let testerExists = false;
    let warning = null;
    
    if (role === 'seller') {
      const seller = await SellerTester.findOne({ 
        where: { testerId, status: 'selected' } 
      });
      testerExists = !!seller;
    } else if (role === 'buyer') {
      const buyer = await BuyerTester.findOne({ 
        where: { testerId, status: 'selected' } 
      });
      testerExists = !!buyer;
    }
    
    // Still accept feedback but warn if ID is invalid
    if (!testerExists) {
      warning = `Warning: Tester ID "${testerId}" not found or not selected as a tester. Please verify your Tester ID is correct.`;
    }

    // Create feedback (accept it anyway for potential valid feedback)
    const feedback = await Feedback.create({
      name, email, testerId, role,
      deviceType, deviceModel, osVersion,
      issueType, priority, title, description,
      stepsToReproduce, expectedBehavior, actualBehavior,
      rating, screenshotUrl,
      status: 'new'
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      warning: warning, // Include warning in response if tester ID is invalid
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all feedback (protected)
 */
exports.getAllFeedback = async (req, res, next) => {
  try {
    const { 
      status, 
      priority, 
      issueType, 
      role, 
      search, 
      page = 1, 
      limit = 50 
    } = req.query;

    // Build query
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    if (issueType && issueType !== 'all') {
      where.issueType = issueType;
    }
    if (role && role !== 'all') {
      where.role = role;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { testerId: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } }
      ];
    }

    // Get feedback with pagination
    const offset = (page - 1) * limit;
    const { count, rows } = await Feedback.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        feedback: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update feedback (protected)
 */
exports.updateFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Update fields
    if (status) feedback.status = status;
    if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback stats (protected)
 */
exports.getFeedbackStats = async (req, res, next) => {
  try {
    const [total, newCount, reviewedCount, resolvedCount, criticalCount] = await Promise.all([
      Feedback.count(),
      Feedback.count({ where: { status: 'new' } }),
      Feedback.count({ where: { status: 'reviewed' } }),
      Feedback.count({ where: { status: 'resolved' } }),
      Feedback.count({ where: { priority: 'Critical' } })
    ]);

    // Calculate average rating
    const avgRatingResult = await Feedback.findOne({
      attributes: [
        [Feedback.sequelize.fn('AVG', Feedback.sequelize.col('rating')), 'avgRating']
      ]
    });
    const avgRating = avgRatingResult ? parseFloat(avgRatingResult.dataValues.avgRating).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        total,
        new: newCount,
        reviewed: reviewedCount,
        resolved: resolvedCount,
        critical: criticalCount,
        avgRating: parseFloat(avgRating)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single feedback by ID (protected)
 */
exports.getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};
