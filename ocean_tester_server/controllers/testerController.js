const { SellerTester, BuyerTester } = require('../models');
const { Op } = require('sequelize');

/**
 * Register a new seller beta tester
 */
exports.registerSeller = async (req, res, next) => {
  try {
    const {
      name, email, phone, whatsapp,
      deviceType, deviceModel, osVersion, screenSize,
      businessType, productCategories
    } = req.body;

    // Validation
    if (!name || !email || !phone || !whatsapp || !deviceType || 
        !deviceModel || !osVersion || !screenSize || 
        !businessType || !productCategories) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if email already exists
    const existing = await SellerTester.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create seller tester
    const seller = await SellerTester.create({
      name, email, phone, whatsapp,
      deviceType, deviceModel, osVersion, screenSize,
      businessType, productCategories,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      data: seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new buyer beta tester
 */
exports.registerBuyer = async (req, res, next) => {
  try {
    const {
      name, email, phone, whatsapp,
      deviceType, deviceModel, osVersion, screenSize,
      buyingPreferences
    } = req.body;

    // Validation
    if (!name || !email || !phone || !whatsapp || !deviceType || 
        !deviceModel || !osVersion || !screenSize || !buyingPreferences) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if email already exists
    const existing = await BuyerTester.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create buyer tester
    const buyer = await BuyerTester.create({
      name, email, phone, whatsapp,
      deviceType, deviceModel, osVersion, screenSize,
      buyingPreferences,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Buyer registered successfully',
      data: buyer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all seller testers (protected)
 */
exports.getAllSellers = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    // Build query
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { testerId: { [Op.like]: `%${search}%` } }
      ];
    }

    // Get testers with pagination
    const offset = (page - 1) * limit;
    const { count, rows } = await SellerTester.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        testers: rows,
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
 * Get all buyer testers (protected)
 */
exports.getAllBuyers = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    // Build query
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { testerId: { [Op.like]: `%${search}%` } }
      ];
    }

    // Get testers with pagination
    const offset = (page - 1) * limit;
    const { count, rows } = await BuyerTester.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        testers: rows,
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
 * Generate unique tester ID
 */
const generateTesterId = async (type) => {
  const prefix = type === 'seller' ? 'OBTS' : 'OBTB';
  const Model = type === 'seller' ? SellerTester : BuyerTester;
  
  // Get the last tester ID for this type
  const lastTester = await Model.findOne({
    where: {
      testerId: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['testerId', 'DESC']]
  });

  let nextNumber = 1001; // Start from 1001
  if (lastTester && lastTester.testerId) {
    // Extract the number part (e.g., "OBTS1001" -> 1001)
    const lastNumber = parseInt(lastTester.testerId.substring(4)); // Skip first 4 chars (OBTS/OBTB)
    nextNumber = lastNumber + 1;
  }

  // Return format: OBTS1001, OBTS1002, OBTB1001, OBTB1002, etc.
  return `${prefix}${nextNumber}`;
};

/**
 * Select tester and generate ID (protected)
 */
exports.selectTester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'seller' or 'buyer'

    if (!type || !['seller', 'buyer'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "seller" or "buyer"'
      });
    }

    const Model = type === 'seller' ? SellerTester : BuyerTester;
    const tester = await Model.findByPk(id);

    if (!tester) {
      return res.status(404).json({
        success: false,
        message: 'Tester not found'
      });
    }

    if (tester.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Tester has already been processed'
      });
    }

    // Generate tester ID
    const testerId = await generateTesterId(type);

    // Update tester
    tester.status = 'selected';
    tester.testerId = testerId;
    await tester.save();

    res.json({
      success: true,
      message: 'Tester selected successfully',
      data: tester
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tester (protected)
 */
exports.updateTester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, status, notes } = req.body;

    if (!type || !['seller', 'buyer'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "seller" or "buyer"'
      });
    }

    const Model = type === 'seller' ? SellerTester : BuyerTester;
    const tester = await Model.findByPk(id);

    if (!tester) {
      return res.status(404).json({
        success: false,
        message: 'Tester not found'
      });
    }

    // Update fields
    if (status) tester.status = status;
    if (notes !== undefined) tester.notes = notes;

    await tester.save();

    res.json({
      success: true,
      message: 'Tester updated successfully',
      data: tester
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tester stats (protected)
 */
exports.getTesterStats = async (req, res, next) => {
  try {
    const { type } = req.query; // 'seller' or 'buyer'

    if (!type || !['seller', 'buyer'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "seller" or "buyer"'
      });
    }

    const Model = type === 'seller' ? SellerTester : BuyerTester;

    const [total, pending, selected, rejected] = await Promise.all([
      Model.count(),
      Model.count({ where: { status: 'pending' } }),
      Model.count({ where: { status: 'selected' } }),
      Model.count({ where: { status: 'rejected' } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        selected,
        rejected
      }
    });
  } catch (error) {
    next(error);
  }
};
