'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if tables already exist
    const tableExists = async (tableName) => {
      try {
        await queryInterface.describeTable(tableName);
        return true;
      } catch (error) {
        return false;
      }
    };

    // Create conversations table
    if (!(await tableExists('conversations'))) {
      console.log('Creating conversations table...');
      await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    } else {
      console.log('conversations table already exists, skipping...');
    }

    // Create conversation_participants table
    if (!(await tableExists('conversationparticipants'))) {
      console.log('Creating conversationparticipants table...');
      await queryInterface.createTable('conversationparticipants', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      isMuted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    } else {
      console.log('conversationparticipants table already exists, skipping...');
    }

    // Create messages table
    if (!(await tableExists('messages'))) {
      console.log('Creating messages table...');
      await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('text', 'image', 'video', 'file', 'audio'),
        allowNull: false,
        defaultValue: 'text'
      },
      replyToId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      isEdited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      editedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deletedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    } else {
      console.log('messages table already exists, skipping...');
    }

    // Create message_reactions table
    if (!(await tableExists('messagereactions'))) {
      console.log('Creating messagereactions table...');
      await queryInterface.createTable('messagereactions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      messageId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reaction: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    } else {
      console.log('messagereactions table already exists, skipping...');
    }

    // Create notifications table
    if (!(await tableExists('notifications'))) {
      console.log('Creating notifications table...');
      await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('info', 'warning', 'error', 'success'),
        allowNull: false,
        defaultValue: 'info'
      },
      category: {
        type: Sequelize.ENUM('message', 'system', 'product', 'auction', 'group_buy'),
        allowNull: false,
        defaultValue: 'system'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    } else {
      console.log('notifications table already exists, skipping...');
    }

    // Add indexes for better performance (only if they don't exist)
    console.log('Adding indexes...');
    try {
      await queryInterface.addIndex('conversationparticipants', ['conversationId']);
      console.log('Added conversationId index to conversationparticipants');
    } catch (error) {
      console.log('conversationId index already exists on conversationparticipants');
    }

    try {
      await queryInterface.addIndex('conversationparticipants', ['userId']);
      console.log('Added userId index to conversationparticipants');
    } catch (error) {
      console.log('userId index already exists on conversationparticipants');
    }

    try {
      await queryInterface.addIndex('conversationparticipants', ['conversationId', 'userId'], {
        unique: true,
        name: 'conversationparticipants_conversation_user_unique'
      });
      console.log('Added unique index to conversationparticipants');
    } catch (error) {
      console.log('Unique index already exists on conversationparticipants');
    }

    try {
      await queryInterface.addIndex('messages', ['conversationId']);
      console.log('Added conversationId index to messages');
    } catch (error) {
      console.log('conversationId index already exists on messages');
    }

    try {
      await queryInterface.addIndex('messages', ['senderId']);
      console.log('Added senderId index to messages');
    } catch (error) {
      console.log('senderId index already exists on messages');
    }

    try {
      await queryInterface.addIndex('messages', ['createdAt']);
      console.log('Added createdAt index to messages');
    } catch (error) {
      console.log('createdAt index already exists on messages');
    }

    try {
      await queryInterface.addIndex('messagereactions', ['messageId']);
      console.log('Added messageId index to messagereactions');
    } catch (error) {
      console.log('messageId index already exists on messagereactions');
    }

    try {
      await queryInterface.addIndex('messagereactions', ['userId']);
      console.log('Added userId index to messagereactions');
    } catch (error) {
      console.log('userId index already exists on messagereactions');
    }

    try {
      await queryInterface.addIndex('messagereactions', ['messageId', 'userId'], {
        unique: true,
        name: 'messagereactions_message_user_unique'
      });
      console.log('Added unique index to messagereactions');
    } catch (error) {
      console.log('Unique index already exists on messagereactions');
    }

    try {
      await queryInterface.addIndex('notifications', ['userId']);
      console.log('Added userId index to notifications');
    } catch (error) {
      console.log('userId index already exists on notifications');
    }

    try {
      await queryInterface.addIndex('notifications', ['isRead']);
      console.log('Added isRead index to notifications');
    } catch (error) {
      console.log('isRead index already exists on notifications');
    }

    try {
      await queryInterface.addIndex('notifications', ['createdAt']);
      console.log('Added createdAt index to notifications');
    } catch (error) {
      console.log('createdAt index already exists on notifications');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('messagereactions');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversationparticipants');
    await queryInterface.dropTable('conversations');
  }
};
