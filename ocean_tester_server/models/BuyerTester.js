const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BuyerTester = sequelize.define('buyer_testers', {
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
  buyingPreferences: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of product categories user is interested in buying'
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
    comment: 'Format: OBTB1001, OBTB1002, etc.'
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

module.exports = BuyerTester;
