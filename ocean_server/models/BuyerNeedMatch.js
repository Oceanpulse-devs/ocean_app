module.exports = (sequelize, DataTypes) => {
  const BuyerNeedMatch = sequelize.define('BuyerNeedMatch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    buyerNeedId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'buyer_need_id',
      references: {
        model: 'buyer_needs',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'seller_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    batchNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'batch_number'
    },
    status: {
      type: DataTypes.ENUM('notified', 'accepted', 'declined', 'expired'),
      defaultValue: 'notified',
      allowNull: false
    },
    notifiedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'notified_at'
    }
  }, {
    tableName: 'buyer_need_matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['buyer_need_id']
      },
      {
        fields: ['seller_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['buyer_need_id', 'status']
      }
    ]
  });

  BuyerNeedMatch.associate = (models) => {
    BuyerNeedMatch.belongsTo(models.BuyerNeed, {
      foreignKey: 'buyer_need_id',
      as: 'buyerNeed'
    });
    BuyerNeedMatch.belongsTo(models.UserTable, {
      foreignKey: 'seller_id',
      as: 'seller'
    });
  };

  return BuyerNeedMatch;
};
