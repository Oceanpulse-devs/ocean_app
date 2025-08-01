const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuctionBid = sequelize.define('AuctionBid', {
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
    bidderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    bidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    isAutoBid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    maxAutoBidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    isWinningBid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'outbid', 'won', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'auctionbids',
    timestamps: true,
    indexes: [
      {
        fields: ['auctionId']
      },
      {
        fields: ['bidderId']
      },
      {
        fields: ['bidAmount']
      },
      {
        fields: ['createdAt']
      },
      {
        unique: true,
        fields: ['auctionId', 'bidderId', 'bidAmount']
      }
    ]
  });

  AuctionBid.associate = (models) => {
    // Bid belongs to Auction
    if (models.Auction) {
      AuctionBid.belongsTo(models.Auction, {
        foreignKey: 'auctionId',
        as: 'auction'
      });
    }

    // Bid belongs to User (bidder)
    if (models.UserTable) {
      AuctionBid.belongsTo(models.UserTable, {
        foreignKey: 'bidderId',
        as: 'bidder'
      });
    }
  };

  return AuctionBid;
}; 