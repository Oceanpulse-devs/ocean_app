const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PostMedia = sequelize.define('PostMedia', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        postId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'posts',
                key: 'id'
            }
        },
        mediaType: {
            type: DataTypes.ENUM('image', 'video'),
            allowNull: false,
            defaultValue: 'image'
        },
        mediaUrl: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        thumbnailUrl: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        mediaOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        altText: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Duration in seconds for videos'
        }
    }, {
        tableName: 'postmedia',
        timestamps: true,
        indexes: [
            {
                fields: ['postId']
            },
            {
                fields: ['mediaOrder']
            }
        ]
    });

    PostMedia.associate = function(models) {
        PostMedia.belongsTo(models.Post, {
            foreignKey: 'postId',
            as: 'post'
        });
    };

    return PostMedia;
}; 