module.exports = (sequelize, DataTypes) => {
    const AuctionView = sequelize.define('AuctionView', {
        auctionId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
            primaryKey: true,
            field: 'auction_id',
            references: {
                model: 'auctions',
                key: 'id'
            }
        },
        viewerId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
            primaryKey: true,
            field: 'viewer_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        viewedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'viewed_at'
        }
    }, {
        tableName: 'auction_views',
        timestamps: false,
        indexes: [
            { fields: ['viewer_id'] }
        ]
    });

    AuctionView.associate = function(models) {
        AuctionView.belongsTo(models.Auction, {
            foreignKey: 'auction_id',
            as: 'auction'
        });
        
        AuctionView.belongsTo(models.UserTable, {
            foreignKey: 'viewer_id',
            as: 'viewer'
        });
    };

    return AuctionView;
};

