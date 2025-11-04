const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserReference = sequelize.define('UserReference', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountType: {
      type: DataTypes.ENUM('admin', 'buyer', 'seller', 'pending-seller'),
      allowNull: false,
      defaultValue: 'buyer'
    },
    accountStatus: {
      type: DataTypes.ENUM('pending', 'active', 'suspended', 'deactivated'),
      allowNull: false,
      defaultValue: 'pending'
    },
    // Additional fields that exist in main server but not used in messaging
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Business name for sellers'
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Seller Table ID (Sellers table) - only for sellers'
    }
  }, {
    tableName: 'users',
    timestamps: true,
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







































