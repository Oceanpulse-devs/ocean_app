const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const VideoLike = sequelize.define('VideoLike', {
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
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'video_likes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['video_id'] },
            { fields: ['user_id'] },
            { fields: ['created_at'] },
            {
                unique: true,
                fields: ['video_id', 'user_id'],
                name: 'uk_video_user_like'
            }
        ]
    });

    VideoLike.associate = function(models) {
        VideoLike.belongsTo(models.Video, {
            foreignKey: 'video_id',
            as: 'video'
        });
        
        VideoLike.belongsTo(models.UserTable, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return VideoLike;
};

