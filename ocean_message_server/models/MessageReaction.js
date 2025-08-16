const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MessageReaction = sequelize.define('MessageReaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'messages',
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
    reaction: {
      type: DataTypes.STRING(10), // Emoji or reaction type
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'messagereactions',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['messageId', 'userId', 'reaction']
      },
      {
        fields: ['messageId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['reaction']
      }
    ]
  });

  MessageReaction.associate = (models) => {
    // Reaction belongs to message
    if (models.Message) {
      MessageReaction.belongsTo(models.Message, {
        foreignKey: 'messageId',
        as: 'message'
      });
    }

    // Reaction belongs to user
    if (models.UserReference) {
      MessageReaction.belongsTo(models.UserReference, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };

  return MessageReaction;
}; 