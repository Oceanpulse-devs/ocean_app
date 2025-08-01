const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserTable = sequelize.define('UserTable', {
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
      allowNull: false,
      unique: true
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
    timestamps: false, // We don't manage timestamps here
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['accountType']
      },
      {
        fields: ['accountStatus']
      }
    ]
  });

  UserTable.associate = (models) => {
    // User has many conversations (as participant)
    if (models.ConversationParticipant) {
      UserTable.hasMany(models.ConversationParticipant, {
        foreignKey: 'userId',
        as: 'conversationParticipants'
      });
    }

    // User has many messages
    if (models.Message) {
      UserTable.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'messages'
      });
    }

    // User has many reactions
    if (models.MessageReaction) {
      UserTable.hasMany(models.MessageReaction, {
        foreignKey: 'userId',
        as: 'messageReactions'
      });
    }

    // User can create conversations
    if (models.Conversation) {
      UserTable.hasMany(models.Conversation, {
        foreignKey: 'createdBy',
        as: 'createdConversations'
      });
    }

    // User can delete messages
    if (models.Message) {
      UserTable.hasMany(models.Message, {
        foreignKey: 'deletedBy',
        as: 'deletedMessages'
      });
    }
  };

  return UserTable;
}; 