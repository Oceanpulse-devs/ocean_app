// models/userFollows.js

module.exports = (sequelize, DataTypes) => {
  const UserFollows = sequelize.define('UserFollows', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    follows_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    }
  }, {
    tableName: 'user_follows',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'follows_user_id']
      }
    ]
  });



  UserFollows.associate = function(models) {
    UserFollows.belongsTo(models.UserTable, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    UserFollows.belongsTo(models.UserTable, {
      foreignKey: 'follows_user_id',
      as: 'followedUser'
    });
  };

  return UserFollows;
};
