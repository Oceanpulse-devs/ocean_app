module.exports = (sequelize, DataTypes) => {
    const Story = sequelize.define('Story', {
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
        mediaUrl: {
            type: DataTypes.STRING(500),
            allowNull: true, // Allow null for text-only stories
            field: 'media_url'
        },
        mediaType: {
            type: DataTypes.ENUM('image', 'video', 'text'),
            allowNull: false,
            field: 'media_type'
        },
        caption: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        backgroundColor: {
            type: DataTypes.STRING(7),
            allowNull: true,
            field: 'background_color'
        },
        textColor: {
            type: DataTypes.STRING(7),
            allowNull: true,
            field: 'text_color'
        },
        fontFamily: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'font_family'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'expires_at'
        },
        viewsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'views_count'
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
        tableName: 'stories',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['user_id', 'expires_at'] },
            { fields: ['expires_at'] },
            { fields: ['created_at'] }
        ]
    });

    // Define associations
    Story.associate = function(models) {
        Story.belongsTo(models.UserTable, {
            foreignKey: 'user_id',
            as: 'user'
        });
        
        Story.hasMany(models.StoryView, {
            foreignKey: 'story_id',
            as: 'views'
        });
    };

    return Story;
};
