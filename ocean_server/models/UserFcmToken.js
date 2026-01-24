const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const UserFcmToken = sequelize.define('UserFcmToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    platform: {
      type: DataTypes.ENUM('android', 'ios', 'web'),
      allowNull: false
    },
    deviceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'device_id'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'user_fcm_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token'] },
      { unique: true, fields: ['user_id', 'device_id'] }
    ]
  });

  UserFcmToken.associate = (models) => {
    if (models.UserTable) {
      UserFcmToken.belongsTo(models.UserTable, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };

  return UserFcmToken;
};
