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