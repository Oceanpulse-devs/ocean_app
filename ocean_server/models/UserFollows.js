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
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'followsUserId']
      }
    ]
  });



  UserFollows.associate = function(models) {
    UserFollows.belongsTo(models.UserTable, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    UserFollows.belongsTo(models.UserTable, {
      foreignKey: 'followsUserId',
      as: 'followedUser'
    });
  };

  return UserFollows;
};
