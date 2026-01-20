const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SavedItem = sequelize.define('SavedItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'User who saved the item'
    },
    itemType: {
      type: DataTypes.ENUM('product', 'post', 'auction', 'swap_deal', 'group_buy', 'distress_sale'),
      allowNull: false,
      field: 'item_type',
      comment: 'Type of item being saved'
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'item_id',
      comment: 'ID of the saved item (product_id, post_id, etc.)'
    },
    collectionName: {
      type: DataTypes.STRING(50),
      defaultValue: 'Favorites',
      field: 'collection_name',
      comment: 'Collection/folder name for organizing saved items'
    }
  }, {
    tableName: 'saved_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_item_lookup',
        fields: ['item_type', 'item_id']
      },
      {
        name: 'unique_save',
        unique: true,
        fields: ['user_id', 'item_type', 'item_id']
      }
    ]
  });

  SavedItem.associate = (models) => {
    // Association with User
    if (models.UserTable) {
      SavedItem.belongsTo(models.UserTable, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
    
    // Note: We don't create direct associations to Product, Post, etc.
    // because itemId can reference different tables based on itemType
    // The association is handled dynamically in the controller
  };

  return SavedItem;
};
