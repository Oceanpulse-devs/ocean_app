const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SavedPost = sequelize.define('SavedPost', {
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
        collectionName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: 'General'
        }
    }, {
        tableName: 'savedposts',
        timestamps: true,
        indexes: [
            {
                fields: ['postId']
            },
            {
                fields: ['userId']
            },
            {
                unique: true,
                fields: ['postId', 'userId']
            }
        ]
    });

    SavedPost.associate = function(models) {
        SavedPost.belongsTo(models.Post, {
            foreignKey: 'postId',
            as: 'post'
        });
        
        SavedPost.belongsTo(models.UserTable, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return SavedPost;
}; 