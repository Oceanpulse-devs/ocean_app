const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductLike = sequelize.define('ProductLike', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products',
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
        }
    }, {
        tableName: 'productlikes',
        timestamps: true,
        indexes: [
            {
                fields: ['productId']
            },
            {
                fields: ['userId']
            },
            {
                unique: true,
                fields: ['productId', 'userId']
            }
        ]
    });

    ProductLike.associate = function(models) {
        ProductLike.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product'
        });
        
        ProductLike.belongsTo(models.UserTable, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return ProductLike;
};

