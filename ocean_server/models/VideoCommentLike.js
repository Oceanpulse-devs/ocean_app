const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const VideoCommentLike = sequelize.define('VideoCommentLike', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        commentId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'comment_id',
            references: {
                model: 'video_comments',
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
        tableName: 'video_comment_likes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['comment_id'] },
            { fields: ['user_id'] },
            {
                unique: true,
                fields: ['comment_id', 'user_id'],
                name: 'uk_comment_user_like'
            }
        ]
    });

    VideoCommentLike.associate = function(models) {
        VideoCommentLike.belongsTo(models.VideoComment, {
            foreignKey: 'comment_id',
            as: 'comment'
        });
        
        VideoCommentLike.belongsTo(models.UserTable, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return VideoCommentLike;
};

