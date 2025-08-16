const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConversationParticipant = sequelize.define('ConversationParticipant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
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
    role: {
      type: DataTypes.ENUM('admin', 'member', 'moderator'),
      allowNull: false,
      defaultValue: 'member'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastReadMessageId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    isMuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'conversationparticipants',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['conversationId', 'userId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['lastReadAt']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  ConversationParticipant.associate = (models) => {
    // Participant belongs to conversation
    if (models.Conversation) {
      ConversationParticipant.belongsTo(models.Conversation, {
        foreignKey: 'conversationId',
        as: 'conversation'
      });
    }

    // Participant belongs to user
    if (models.UserTable) {
      ConversationParticipant.belongsTo(models.UserTable, {
        foreignKey: 'userId',
        as: 'user'
      });
    }

    // Participant has one last read message
    if (models.Message) {
      ConversationParticipant.belongsTo(models.Message, {
        foreignKey: 'lastReadMessageId',
        as: 'lastReadMessage'
      });
    }
  };

  return ConversationParticipant;
}; 