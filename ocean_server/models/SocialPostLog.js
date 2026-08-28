const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SocialPostLog = sequelize.define('SocialPostLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'seller_id',
      comment: 'Reference to sellers table'
    },
    itemType: {
      type: DataTypes.ENUM('product', 'auction', 'group_buy', 'swap_deal', 'distress_sale', 'post'),
      allowNull: false,
      field: 'item_type',
      comment: 'Content type being posted'
    },
    itemId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'item_id',
      comment: 'Reference ID of the item'
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Platform target (facebook, instagram, whatsapp, etc.)'
    },
    zernioPostId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'zernio_post_id',
      comment: 'Zernio post reference ID'
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
      comment: 'Publication status'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
      comment: 'Failure details if posting failed'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at',
      comment: 'Timestamp when successfully published'
    }
  }, {
    tableName: 'social_post_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['seller_id']
      },
      {
        fields: ['item_type', 'item_id']
      }
    ]
  });

  SocialPostLog.associate = function(models) {
    if (models.SellersTable) {
      SocialPostLog.belongsTo(models.SellersTable, {
        foreignKey: 'seller_id',
        as: 'seller'
      });
    }
  };

  return SocialPostLog;
};
