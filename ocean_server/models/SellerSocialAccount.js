const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SellerSocialAccount = sequelize.define('SellerSocialAccount', {
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
    zernioProfileId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'zernio_profile_id',
      comment: 'Zernio profile/account identifier'
    },
    platform: {
      type: DataTypes.ENUM('facebook', 'instagram', 'whatsapp', 'tiktok', 'linkedin'),
      allowNull: false,
      comment: 'Social platform name'
    },
    accountName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'account_name',
      comment: 'Connected page/account name (e.g. Apex Electronics Page)'
    },
    accountId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'account_id',
      comment: 'Social platform internal ID'
    },
    isConnected: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_connected',
      comment: 'Connection status'
    },
    autoPostDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'auto_post_default',
      comment: 'Whether this account is auto-posted to by default'
    }
  }, {
    tableName: 'seller_social_accounts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['seller_id', 'platform', 'zernio_profile_id']
      },
      {
        fields: ['seller_id']
      }
    ]
  });

  SellerSocialAccount.associate = function(models) {
    if (models.SellersTable) {
      SellerSocialAccount.belongsTo(models.SellersTable, {
        foreignKey: 'seller_id',
        as: 'seller'
      });
    }
  };

  return SellerSocialAccount;
};
