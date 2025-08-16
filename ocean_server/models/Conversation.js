const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
      defaultValue: 'direct'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true // Only for group conversations
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastMessageId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['lastMessageAt']
      },
      {
        fields: ['createdBy']
      }
    ]
  });

  Conversation.associate = (models) => {
    // Conversation has many participants
    if (models.ConversationParticipant) {
      Conversation.hasMany(models.ConversationParticipant, {
        foreignKey: 'conversationId',
        as: 'participants'
      });
    }

    // Conversation has many messages
    if (models.Message) {
      Conversation.hasMany(models.Message, {
        foreignKey: 'conversationId',
        as: 'messages'
      });
    }

    // Conversation belongs to creator
    if (models.UserTable) {
      Conversation.belongsTo(models.UserTable, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }

    // Conversation has one last message
    if (models.Message) {
      Conversation.belongsTo(models.Message, {
        foreignKey: 'lastMessageId',
        as: 'lastMessage'
      });
    }
  };

  return Conversation;
}; 