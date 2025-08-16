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
        fields: ['userId', 'followsUserId']
      }
    ]
  });



  return UserFollows;
};
