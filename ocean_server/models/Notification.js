const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'admin'),
      defaultValue: 'info',
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'system'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isEmailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailSentAt: {
      type: DataTypes.DATE,
    },
    readAt: {
      type: DataTypes.DATE,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    deliveryMethods: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Methods to deliver this alert: push, email, sms, in_app'
    },
    targetEntityType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'e.g., product, auction, group_buy'
    },
    targetEntityId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
  });

  // Define associations
  Notification.associate = (models) => {
    Notification.belongsTo(models.UserTable, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Notification;
}; 