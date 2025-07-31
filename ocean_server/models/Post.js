const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Post = sequelize.define('Post', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        postType: {
            type: DataTypes.ENUM('product', 'buyer_request', 'general'),
            allowNull: false,
            defaultValue: 'product'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        // Product-specific fields
        productName: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        brand: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        currency: {
            type: DataTypes.STRING(3),
            defaultValue: 'USD'
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        // Region/Country for filtering
        userRegion: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        userCountry: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        // Engagement counters
        likesCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        commentsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        sharesCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        savedCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        // Status
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'deleted'),
            defaultValue: 'active'
        },
        // Tags for search
        tags: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        tableName: 'posts',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['postType']
            },
            {
                fields: ['userRegion']
            },
            {
                fields: ['userCountry']
            },
            {
                fields: ['status']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    Post.associate = function(models) {
        Post.belongsTo(models.UserTable, {
            foreignKey: 'userId',
            as: 'user'
        });
        
        if (models.PostMedia) {
            Post.hasMany(models.PostMedia, {
                foreignKey: 'postId',
                as: 'media'
            });
        }
        
        if (models.PostLike) {
            Post.hasMany(models.PostLike, {
                foreignKey: 'postId',
                as: 'likes'
            });
        }
        
        if (models.PostComment) {
            Post.hasMany(models.PostComment, {
                foreignKey: 'postId',
                as: 'comments'
            });
        }
        
        if (models.PostShare) {
            Post.hasMany(models.PostShare, {
                foreignKey: 'postId',
                as: 'shares'
            });
        }
        
        if (models.SavedPost) {
            Post.hasMany(models.SavedPost, {
                foreignKey: 'postId',
                as: 'savedBy'
            });
        }
    };

    return Post;
}; 