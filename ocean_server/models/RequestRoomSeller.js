module.exports = (sequelize, DataTypes) => {
  const RequestRoomSeller = sequelize.define('RequestRoomSeller', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    requestRoomId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'request_room_id',
      comment: 'ID of the request room'
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'seller_id',
      comment: 'User ID of the interested seller'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
      comment: 'Timestamp when seller expressed interest'
    }
  }, {
    tableName: 'request_room_sellers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['request_room_id', 'seller_id']
      },
      {
        fields: ['seller_id']
      }
    ]
  });

  RequestRoomSeller.associate = function(models) {
    RequestRoomSeller.belongsTo(models.RequestRoom, {
      foreignKey: 'requestRoomId',
      as: 'requestRoom'
    });
    RequestRoomSeller.belongsTo(models.UserTable, {
      foreignKey: 'sellerId',
      as: 'seller'
    });
  };

  return RequestRoomSeller;
};
