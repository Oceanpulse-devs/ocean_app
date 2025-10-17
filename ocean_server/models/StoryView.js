module.exports = (sequelize, DataTypes) => {
    const StoryView = sequelize.define('StoryView', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        storyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'story_id',
            references: {
                model: 'stories',
                key: 'id'
            }
        },
        viewerId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'viewer_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        viewedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'viewed_at'
        }
    }, {
        tableName: 'story_views',
        timestamps: false,
        indexes: [
            { fields: ['story_id'] },
            { fields: ['viewer_id'] },
            { 
                unique: true,
                fields: ['story_id', 'viewer_id'],
                name: 'unique_view'
            }
        ]
    });

    // Define associations
    StoryView.associate = function(models) {
        StoryView.belongsTo(models.Story, {
            foreignKey: 'story_id',
            as: 'story'
        });
        
        StoryView.belongsTo(models.UserTable, {
            foreignKey: 'viewer_id',
            as: 'viewer'
        });
    };

    return StoryView;
};
