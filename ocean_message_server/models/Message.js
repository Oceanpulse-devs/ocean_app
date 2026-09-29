const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
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
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'system'),
      allowNull: false,
      defaultValue: 'text'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mediaUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    mediaType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    mediaSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mediaDuration: {
      type: DataTypes.INTEGER,
      allowNull: true // For audio/video in seconds
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    replyToId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isForwarded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    forwardedFromId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    readBy: {
      type: DataTypes.JSON,
      allowNull: true // Array of user IDs who read the message
    },
    deliveredTo: {
      type: DataTypes.JSON,
      allowNull: true // Array of user IDs who received the message
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referenceType: {
      type: DataTypes.ENUM('buyer_need', 'product', 'swap_deal', 'distress_sale', 'auction', 'story', 'market_update'),
      allowNull: true,
      field: 'reference_type'
    },
    referenceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reference_id'
    },
    referenceTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reference_title'
    },
    referenceCategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'reference_category'
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        fields: ['conversationId']
      },
      {
        fields: ['senderId']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['type']
      },
      {
        fields: ['isDeleted']
      },
      {
        fields: ['replyToId']
      },
      {
        fields: ['referenceType']
      },
      {
        fields: ['referenceId']
      },
      {
        fields: ['referenceType', 'referenceId']
      }
    ]
  });

  Message.associate = (models) => {
    // Message belongs to conversation
    if (models.Conversation) {
      Message.belongsTo(models.Conversation, {
        foreignKey: 'conversationId',
        as: 'conversation'
      });
    }

    // Message belongs to sender
    if (models.UserReference) {
      Message.belongsTo(models.UserReference, {
        foreignKey: 'senderId',
        as: 'sender'
      });
    }

    // Message can reply to another message
    if (models.Message) {
      Message.belongsTo(models.Message, {
        foreignKey: 'replyToId',
        as: 'replyTo'
      });
      Message.hasMany(models.Message, {
        foreignKey: 'replyToId',
        as: 'replies'
      });
    }

    // Message can be forwarded from another message
    if (models.Message) {
      Message.belongsTo(models.Message, {
        foreignKey: 'forwardedFromId',
        as: 'forwardedFrom'
      });
    }

    // Message can be deleted by a user
    if (models.UserReference) {
      Message.belongsTo(models.UserReference, {
        foreignKey: 'deletedBy',
        as: 'deletedByUser'
      });
    }

    // Message has many reactions
    if (models.MessageReaction) {
      Message.hasMany(models.MessageReaction, {
        foreignKey: 'messageId',
        as: 'reactions'
      });
    }
  };

  return Message;
}; 