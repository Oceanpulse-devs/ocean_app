const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SellerFeedbackResponseLike = sequelize.define('SellerFeedbackResponseLike', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        responseId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'response_id',
            references: {
                model: 'seller_feedback_responses',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'seller_feedback_response_likes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['response_id'] },
            { fields: ['user_id'] },
            { fields: ['created_at'] },
            {
                unique: true,
                fields: ['response_id', 'user_id'],
                name: 'uk_response_user_like'
            }
        ]
    });

    SellerFeedbackResponseLike.associate = function(models) {
        SellerFeedbackResponseLike.belongsTo(models.SellerFeedbackResponse, {
            foreignKey: 'response_id',
            as: 'response'
        });
        
        SellerFeedbackResponseLike.belongsTo(models.UserTable, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return SellerFeedbackResponseLike;
};

