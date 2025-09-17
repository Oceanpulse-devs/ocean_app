const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductCategory = sequelize.define('ProductCategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'productcategories',
        key: 'id'
      }
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isCustom: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this category was created by a user (custom) or is a system category'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID who created this custom category (null for system categories)',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of times this category has been used in products'
    }
  }, {
    tableName: 'productcategories',
    timestamps: true
  });

  ProductCategory.associate = (models) => {
    // Self-referencing for parent-child categories
    ProductCategory.hasMany(ProductCategory, {
      foreignKey: 'parentId',
      as: 'subcategories'
    });
    
    ProductCategory.belongsTo(ProductCategory, {
      foreignKey: 'parentId',
      as: 'parent'
    });

    // Association with UserTable for custom categories
    ProductCategory.belongsTo(models.UserTable, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return ProductCategory;
}; 