const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'success'),
      allowNull: false,
      defaultValue: 'info'
    },
    category: {
      type: DataTypes.ENUM('message', 'system', 'product', 'auction', 'group_buy'),
      allowNull: false,
      defaultValue: 'system'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    freezeTableName: true
  });

  // Define associations
  Notification.associate = (models) => {
    Notification.belongsTo(models.UserReference, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Notification;
};

