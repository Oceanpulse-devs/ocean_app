module.exports = (sequelize, DataTypes) => {
  const RequestRoom = sequelize.define('RequestRoom', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    insightId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'insight_id',
      comment: 'ID of the BuyerSearchInsight'
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'buyer_id',
      comment: 'User ID of the buyer who performed the search'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'COMPLETED'),
      defaultValue: 'ACTIVE',
      comment: 'Status of the request room'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
      comment: 'Timestamp when this temporary room expires (24 hours after creation)'
    }
  }, {
    tableName: 'request_rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['insight_id']
      },
      {
        fields: ['buyer_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  RequestRoom.associate = function(models) {
    RequestRoom.belongsTo(models.BuyerSearchInsight, {
      foreignKey: 'insightId',
      as: 'insight'
    });
    RequestRoom.belongsTo(models.UserTable, {
      foreignKey: 'buyerId',
      as: 'buyer'
    });
    RequestRoom.hasMany(models.RequestRoomSeller, {
      foreignKey: 'requestRoomId',
      as: 'sellers'
    });
  };

  return RequestRoom;
};
