const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SellerTester = sequelize.define('seller_testers', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  whatsapp: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  deviceType: {
    type: DataTypes.ENUM('Android', 'IOS'),
    allowNull: false
  },
  deviceModel: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  osVersion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  screenSize: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  businessType: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of business types: Retailers, Wholesalers, Manufacturer'
  },
  productCategories: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of 1-3 product categories'
  },
  status: {
    type: DataTypes.ENUM('pending', 'selected', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  testerId: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true,
    comment: 'Format: OBTS1001, OBTS1002, etc.'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['testerId'], unique: true },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = SellerTester;
