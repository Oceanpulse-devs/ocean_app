const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Video = sequelize.define('Video', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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
        videoUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
            field: 'video_url'
        },
        thumbnailUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'thumbnail_url'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ctaEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'cta_enabled'
        },
        ctaType: {
            type: DataTypes.ENUM('message_seller', 'call_seller', 'message_buyer', 'none'),
            defaultValue: 'none',
            field: 'cta_type'
        },
        ctaLabel: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'cta_label'
        },
        videoRole: {
            type: DataTypes.ENUM('seller', 'buyer'),
            defaultValue: 'seller',
            field: 'video_role'
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Video duration in seconds'
        },
        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: 'file_size',
            comment: 'Video file size in bytes'
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'mime_type'
        },
        likeCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'like_count'
        },
        commentCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'comment_count'
        },
        shareCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'share_count'
        },
        viewsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'views_count'
        },
        isSponsored: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_sponsored'
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'deleted'),
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
        tableName: 'videos',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['status'] },
            { fields: ['video_role'] },
            { fields: ['cta_type'] },
            { fields: ['is_sponsored'] },
            { fields: ['created_at'] },
            { fields: ['like_count'] },
            { fields: ['views_count'] }
        ]
    });

    // Define associations
    Video.associate = function(models) {
        Video.belongsTo(models.UserTable, {
            foreignKey: 'user_id',
            as: 'user'
        });
        
        Video.hasMany(models.VideoLike, {
            foreignKey: 'video_id',
            as: 'likes'
        });
        
        Video.hasMany(models.VideoView, {
            foreignKey: 'video_id',
            as: 'views'
        });
        
        Video.hasMany(models.VideoComment, {
            foreignKey: 'video_id',
            as: 'comments'
        });
    };

    return Video;
};

