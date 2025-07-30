const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SellersTable = sequelize.define('SellersTable', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'rejected', 'approved', 'suspended', 'active'),
      defaultValue: 'pending',
    },
    verifiedAt: {
      type: DataTypes.DATE,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    totalSales: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    }
  }, {
    tableName: 'sellers',
    timestamps: true,
  });

  // Define associations
  SellersTable.associate = (models) => {
    SellersTable.hasMany(models.SellerDocument, {
      foreignKey: 'sellerId',
      as: 'documents'
    });
  };

  return SellersTable;
};
