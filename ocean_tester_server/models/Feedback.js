const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define('feedback', {
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
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  testerId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM('seller', 'buyer'),
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
  issueType: {
    type: DataTypes.ENUM('Bug', 'Feature Request', 'UI/UX Issue', 'Performance', 'Other'),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('Critical', 'High', 'Medium', 'Low'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  stepsToReproduce: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expectedBehavior: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actualBehavior: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  screenshotUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('new', 'reviewed', 'resolved'),
    defaultValue: 'new',
    allowNull: false
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['testerId'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['issueType'] },
    { fields: ['role'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Feedback;
