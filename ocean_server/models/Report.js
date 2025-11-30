const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Report = sequelize.define('Report', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        reporterId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'reporter_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        reportedUserId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'reported_user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        reportType: {
            type: DataTypes.ENUM(
                'user',
                'seller',
                'post',
                'product',
                'video',
                'auction',
                'swap_deal',
                'distress_sale',
                'bulk_purchase',
                'comment'
            ),
            allowNull: false,
            field: 'report_type'
        },
        itemId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'item_id'
        },
        reason: {
            type: DataTypes.ENUM(
                'spam',
                'inappropriate_content',
                'scam_fraud',
                'harassment',
                'fake_product',
                'copyright_violation',
                'other'
            ),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
            defaultValue: 'pending'
        },
        adminNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'admin_notes'
        },
        resolvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'resolved_by',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'resolved_at'
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
        tableName: 'reports',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['reporter_id'] },
            { fields: ['reported_user_id'] },
            { fields: ['report_type'] },
            { fields: ['item_id'] },
            { fields: ['reason'] },
            { fields: ['status'] },
            { fields: ['created_at'] },
            { fields: ['resolved_by'] },
            {
                fields: ['reporter_id', 'report_type', 'item_id'],
                name: 'idx_reporter_type_item'
            }
        ]
    });

    // Define associations
    Report.associate = function(models) {
        // Reporter (user who made the report)
        Report.belongsTo(models.UserTable, {
            foreignKey: 'reporter_id',
            as: 'reporter'
        });
        
        // Reported user (user/seller being reported)
        Report.belongsTo(models.UserTable, {
            foreignKey: 'reported_user_id',
            as: 'reportedUser'
        });
        
        // Admin who resolved the report
        Report.belongsTo(models.UserTable, {
            foreignKey: 'resolved_by',
            as: 'resolver'
        });
    };

    return Report;
};

