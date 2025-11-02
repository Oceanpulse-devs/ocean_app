const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const BuyerNeedMedia = sequelize.define('BuyerNeedMedia', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        buyerNeedId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'buyer_needs',
                key: 'id'
            }
        },
        mediaType: {
            type: DataTypes.ENUM('image', 'video'),
            allowNull: false,
            defaultValue: 'image'
        },
        mediaUrl: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        thumbnailUrl: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        mediaOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        altText: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Duration in seconds for videos'
        }
    }, {
        tableName: 'buyer_need_media',
        timestamps: true,
        indexes: [
            {
                fields: ['buyerNeedId']
            },
            {
                fields: ['mediaOrder']
            }
        ]
    });

    BuyerNeedMedia.associate = function(models) {
        BuyerNeedMedia.belongsTo(models.BuyerNeed, {
            foreignKey: 'buyerNeedId',
            as: 'buyerNeed'
        });
    };

    return BuyerNeedMedia;
};
