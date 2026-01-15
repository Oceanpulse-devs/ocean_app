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
      field: 'user_id'  // Map to snake_case column
    },
    followsUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'follows_user_id'  // Map to snake_case column
    }
  }, {
    tableName: 'user_follows',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'follows_user_id']  // Use database column names, not property names
      }
    ]
  });



  UserFollows.associate = function(models) {
    UserFollows.belongsTo(models.UserTable, {
      foreignKey: 'user_id',  // Use actual database column name, not property name
      targetKey: 'id',
      as: 'user'
    });
    
    UserFollows.belongsTo(models.UserTable, {
      foreignKey: 'follows_user_id',  // Use actual database column name, not property name
      targetKey: 'id',
      as: 'followedUser'
    });
  };

  return UserFollows;
};
