module.exports = (sequelize, DataTypes) => {
    const SwapDealView = sequelize.define('SwapDealView', {
        swapDealId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
            primaryKey: true,
            field: 'swap_deal_id',
            references: {
                model: 'swap_deals',
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
        tableName: 'swap_deal_views',
        timestamps: false,
        indexes: [
            { fields: ['viewer_id'] }
        ]
    });

    SwapDealView.associate = function(models) {
        SwapDealView.belongsTo(models.SwapDeal, {
            foreignKey: 'swap_deal_id',
            as: 'swapDeal'
        });
        
        SwapDealView.belongsTo(models.UserTable, {
            foreignKey: 'viewer_id',
            as: 'viewer'
        });
    };

    return SwapDealView;
};

