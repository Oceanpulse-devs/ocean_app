const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserReference = sequelize.define('UserReference', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    accountType: {
      type: DataTypes.ENUM('buyer', 'seller', 'admin', 'pending-seller'),
      allowNull: false,
      defaultValue: 'buyer'
    },
    accountStatus: {
      type: DataTypes.ENUM('active', 'suspended', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'users',
    timestamps: false,
    freezeTableName: true
  });

  UserReference.associate = (models) => {
    // User has many conversations (as participant)
    if (models.ConversationParticipant) {
      UserReference.hasMany(models.ConversationParticipant, {
        foreignKey: 'userId',
        as: 'conversationParticipants'
      });
    }

    // User has many messages
    if (models.Message) {
      UserReference.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'messages'
      });
    }

    // User has many reactions
    if (models.MessageReaction) {
      UserReference.hasMany(models.MessageReaction, {
        foreignKey: 'userId',
        as: 'messageReactions'
      });
    }

    // User can create conversations
    if (models.Conversation) {
      UserReference.hasMany(models.Conversation, {
        foreignKey: 'createdBy',
        as: 'createdConversations'
      });
    }

    // User can delete messages
    if (models.Message) {
      UserReference.hasMany(models.Message, {
        foreignKey: 'deletedBy',
        as: 'deletedMessages'
      });
    }
  };

  return UserReference;
};





















