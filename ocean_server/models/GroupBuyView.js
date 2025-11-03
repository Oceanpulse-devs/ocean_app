module.exports = (sequelize, DataTypes) => {
    const GroupBuyView = sequelize.define('GroupBuyView', {
        groupBuyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            field: 'group_buy_id',
            references: {
                model: 'group_buys',
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
        tableName: 'group_buy_views',
        timestamps: false,
        indexes: [
            { fields: ['viewer_id'] }
        ]
    });

    GroupBuyView.associate = function(models) {
        GroupBuyView.belongsTo(models.GroupBuy, {
            foreignKey: 'group_buy_id',
            as: 'groupBuy'
        });
        
        GroupBuyView.belongsTo(models.UserTable, {
            foreignKey: 'viewer_id',
            as: 'viewer'
        });
    };

    return GroupBuyView;
};

