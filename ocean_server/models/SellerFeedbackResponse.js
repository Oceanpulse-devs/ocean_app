const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SellerFeedbackResponse = sequelize.define('SellerFeedbackResponse', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        feedbackId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'feedback_id',
            references: {
                model: 'seller_feedback',
                key: 'id'
            }
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
        responseText: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'response_text'
        },
        isEdited: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_edited'
        },
        likeCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'like_count'
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
        tableName: 'seller_feedback_responses',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['feedback_id'] },
            { fields: ['seller_id'] },
            { fields: ['created_at'] },
            {
                unique: true,
                fields: ['feedback_id'],
                name: 'uk_feedback_response'
            }
        ]
    });

    SellerFeedbackResponse.associate = function(models) {
        SellerFeedbackResponse.belongsTo(models.SellerFeedback, {
            foreignKey: 'feedback_id',
            as: 'feedback'
        });
        
        SellerFeedbackResponse.belongsTo(models.UserTable, {
            foreignKey: 'seller_id',
            as: 'seller'
        });
        
        SellerFeedbackResponse.hasMany(models.SellerFeedbackResponseLike, {
            foreignKey: 'response_id',
            as: 'likes'
        });
    };

    return SellerFeedbackResponse;
};

