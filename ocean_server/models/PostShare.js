const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PostShare = sequelize.define('PostShare', {
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
        shareType: {
            type: DataTypes.ENUM('internal', 'external', 'social'),
            defaultValue: 'internal'
        },
        sharePlatform: {
            type: DataTypes.STRING(50),
            allowNull: true
        }
    }, {
        tableName: 'postshares',
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

    PostShare.associate = function(models) {
        PostShare.belongsTo(models.Post, {
            foreignKey: 'postId',
            as: 'post'
        });
        
        PostShare.belongsTo(models.UserTable, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return PostShare;
}; 