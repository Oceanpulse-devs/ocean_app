const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SavedProduct = sequelize.define('SavedProduct', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    collectionName: {
      type: DataTypes.STRING(50),
      defaultValue: 'Favorites'
    }
  }, {
    tableName: 'savedproducts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'productId']
      }
    ]
  });

  SavedProduct.associate = (models) => {
    if (models.UserTable) {
      SavedProduct.belongsTo(models.UserTable, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
    
    if (models.Product) {
      SavedProduct.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  };

  return SavedProduct;
}; 