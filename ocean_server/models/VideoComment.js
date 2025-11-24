const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const VideoComment = sequelize.define('VideoComment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        videoId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'video_id',
            references: {
                model: 'videos',
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
        comment: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        parentCommentId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'parent_comment_id',
            references: {
                model: 'video_comments',
                key: 'id'
            }
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
        tableName: 'video_comments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['video_id'] },
            { fields: ['user_id'] },
            { fields: ['parent_comment_id'] },
            { fields: ['status'] },
            { fields: ['created_at'] }
        ]
    });

    VideoComment.associate = function(models) {
        VideoComment.belongsTo(models.Video, {
            foreignKey: 'video_id',
            as: 'video'
        });
        
        VideoComment.belongsTo(models.UserTable, {
            foreignKey: 'user_id',
            as: 'user'
        });
        
        VideoComment.belongsTo(models.VideoComment, {
            foreignKey: 'parent_comment_id',
            as: 'parentComment'
        });
        
        VideoComment.hasMany(models.VideoComment, {
            foreignKey: 'parent_comment_id',
            as: 'replies'
        });
        
        VideoComment.hasMany(models.VideoCommentLike, {
            foreignKey: 'comment_id',
            as: 'likes'
        });
    };

    return VideoComment;
};

