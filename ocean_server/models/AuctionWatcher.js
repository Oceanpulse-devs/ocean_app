const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuctionWatcher = sequelize.define('AuctionWatcher', {
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notificationsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastViewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'auctionwatchers',
    timestamps: true,
    indexes: [
      {
        fields: ['auctionId']
      },
      {
        fields: ['userId']
      },
      {
        unique: true,
        fields: ['auctionId', 'userId']
      }
    ]
  });

  AuctionWatcher.associate = (models) => {
    // Watcher belongs to Auction
    if (models.Auction) {
      AuctionWatcher.belongsTo(models.Auction, {
        foreignKey: 'auctionId',
        as: 'auction'
      });
    }

    // Watcher belongs to User
    if (models.UserTable) {
      AuctionWatcher.belongsTo(models.UserTable, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };

  return AuctionWatcher;
}; 