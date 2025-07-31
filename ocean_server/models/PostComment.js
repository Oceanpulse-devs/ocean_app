const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PostComment = sequelize.define('PostComment', {
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
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        parentCommentId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'postcomments',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        mediaUrl: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        mediaType: {
            type: DataTypes.ENUM('image', 'video'),
            allowNull: true
        },
        likesCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('active', 'hidden', 'deleted'),
            defaultValue: 'active'
        }
    }, {
        tableName: 'postcomments',
        timestamps: true,
        indexes: [
            {
                fields: ['postId']
            },
            {
                fields: ['userId']
            },
            {
                fields: ['parentCommentId']
            },
            {
                fields: ['status']
            }
        ]
    });

    PostComment.associate = function(models) {
        PostComment.belongsTo(models.Post, {
            foreignKey: 'postId',
            as: 'post'
        });
        
        PostComment.belongsTo(models.UserTable, {
            foreignKey: 'userId',
            as: 'user'
        });
        
        PostComment.belongsTo(models.PostComment, {
            foreignKey: 'parentCommentId',
            as: 'parentComment'
        });
        
        PostComment.hasMany(models.PostComment, {
            foreignKey: 'parentCommentId',
            as: 'replies'
        });
    };

    return PostComment;
}; 