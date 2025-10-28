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
      field: 'user_id',
    },
    followsUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'follows_user_id',
    }
  }, {
    tableName: 'user_follows',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'follows_user_id']
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
