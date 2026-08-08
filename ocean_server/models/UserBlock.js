const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserBlock = sequelize.define('UserBlock', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blockerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'blocker_id',
      comment: 'ID of the user who initiated the block'
    },
    blockedId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'blocked_id',
      comment: 'ID of the user being blocked'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional reason for blocking'
    }
  }, {
    tableName: 'user_blocks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['blocker_id', 'blocked_id']
      },
      {
        fields: ['blocked_id']
      }
    ]
  });

  UserBlock.associate = function(models) {
    UserBlock.belongsTo(models.UserTable, {
      foreignKey: 'blocker_id',
      targetKey: 'id',
      as: 'blocker'
    });

    UserBlock.belongsTo(models.UserTable, {
      foreignKey: 'blocked_id',
      targetKey: 'id',
      as: 'blockedUser'
    });
  };

  return UserBlock;
};
