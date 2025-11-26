const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SellerFeedbackLike = sequelize.define('SellerFeedbackLike', {
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
        tableName: 'seller_feedback_likes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['feedback_id'] },
            { fields: ['user_id'] },
            { fields: ['created_at'] },
            {
                unique: true,
                fields: ['feedback_id', 'user_id'],
                name: 'uk_feedback_user_like'
            }
        ]
    });

    SellerFeedbackLike.associate = function(models) {
        SellerFeedbackLike.belongsTo(models.SellerFeedback, {
            foreignKey: 'feedback_id',
            as: 'feedback'
        });
        
        SellerFeedbackLike.belongsTo(models.UserTable, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return SellerFeedbackLike;
};

