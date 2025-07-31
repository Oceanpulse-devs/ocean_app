const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PostLike = sequelize.define('PostLike', {
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
        }
    }, {
        tableName: 'postlikes',
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

    PostLike.associate = function(models) {
        PostLike.belongsTo(models.Post, {
            foreignKey: 'postId',
            as: 'post'
        });
        
        PostLike.belongsTo(models.UserTable, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return PostLike;
}; 