const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SellerFeedback = sequelize.define('SellerFeedback', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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
        reviewerId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'reviewer_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        likeCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'like_count'
        },
        status: {
            type: DataTypes.ENUM('active', 'deleted', 'hidden'),
            defaultValue: 'active'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at'
        }
    }, {
        tableName: 'seller_feedback',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['seller_id'] },
            { fields: ['reviewer_id'] },
            { fields: ['rating'] },
            { fields: ['status'] },
            { fields: ['created_at'] },
            { fields: ['like_count'] },
            {
                unique: true,
                fields: ['seller_id', 'reviewer_id'],
                name: 'uk_seller_reviewer'
            }
        ]
    });

    // Define associations
    SellerFeedback.associate = function(models) {
        SellerFeedback.belongsTo(models.UserTable, {
            foreignKey: 'seller_id',
            as: 'seller'
        });
        
        SellerFeedback.belongsTo(models.UserTable, {
            foreignKey: 'reviewer_id',
            as: 'reviewer'
        });
        
        SellerFeedback.hasMany(models.SellerFeedbackLike, {
            foreignKey: 'feedback_id',
            as: 'likes'
        });
        
        SellerFeedback.hasOne(models.SellerFeedbackResponse, {
            foreignKey: 'feedback_id',
            as: 'response'
        });
    };

    return SellerFeedback;
};

