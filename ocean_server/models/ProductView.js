module.exports = (sequelize, DataTypes) => {
    const ProductView = sequelize.define('ProductView', {
        productId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
            primaryKey: true,
            field: 'product_id',
            references: {
                model: 'products',
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
        tableName: 'product_views',
        timestamps: false,
        indexes: [
            { fields: ['viewer_id'] }
        ]
    });

    ProductView.associate = function(models) {
        ProductView.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'product'
        });
        
        ProductView.belongsTo(models.UserTable, {
            foreignKey: 'viewer_id',
            as: 'viewer'
        });
    };

    return ProductView;
};

