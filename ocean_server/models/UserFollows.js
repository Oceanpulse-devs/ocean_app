// models/userFollows.js

module.exports = (sequelize, DataTypes) => {
  const UserFollows = sequelize.define('UserFollows', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    followsUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    }
  }, {
    tableName: 'user_follows',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'followsUserId'] // Prevent double follow
      }
    ]
  });

  // Associations (optional but useful if you're using a Users model)
//   UserFollows.associate = models => {
//     UserFollows.belongsTo(models.UserTable, { as: 'follower', foreignKey: 'userId' });
//     UserFollows.belongsTo(models.UserTable, { as: 'followed', foreignKey: 'followsUserId' });
//   };

  return UserFollows;
};
