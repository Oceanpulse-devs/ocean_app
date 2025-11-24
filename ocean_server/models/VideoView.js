const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const VideoView = sequelize.define('VideoView', {
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
            allowNull: true,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
            field: 'ip_address'
        },
        viewedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'viewed_at'
        }
    }, {
        tableName: 'video_views',
        timestamps: false,
        indexes: [
            { fields: ['video_id'] },
            { fields: ['user_id'] },
            { fields: ['viewed_at'] },
            { fields: ['video_id', 'user_id'] }
        ]
    });

    VideoView.associate = function(models) {
        VideoView.belongsTo(models.Video, {
            foreignKey: 'video_id',
            as: 'video'
        });
        
        VideoView.belongsTo(models.UserTable, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return VideoView;
};

