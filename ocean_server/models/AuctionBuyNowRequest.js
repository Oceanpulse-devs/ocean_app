const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuctionBuyNowRequest = sequelize.define('AuctionBuyNowRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    auctionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'auctions',
        key: 'id'
      }
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    buyNowPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional message from buyer'
    }
  }, {
    tableName: 'auction_buy_now_requests',
    timestamps: true,
    indexes: [
      {
        fields: ['auctionId']
      },
      {
        fields: ['buyerId']
      },
      {
        fields: ['status']
      }
    ]
  });

  AuctionBuyNowRequest.associate = (models) => {
    // Request belongs to Auction
    if (models.Auction) {
      AuctionBuyNowRequest.belongsTo(models.Auction, {
        foreignKey: 'auctionId',
        as: 'auction'
      });
    }

    // Request belongs to User (buyer)
    if (models.UserTable) {
      AuctionBuyNowRequest.belongsTo(models.UserTable, {
        foreignKey: 'buyerId',
        as: 'buyer'
      });
    }
  };

  return AuctionBuyNowRequest;
};

