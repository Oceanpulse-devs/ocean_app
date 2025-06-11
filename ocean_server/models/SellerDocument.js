// sellerDocuments.js for all sellers verification approach
module.exports = (sequelize, DataTypes) => {
  const SellerDocument = sequelize.define('SellerDocument', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    documentType: {
      type: DataTypes.ENUM('NIN', 'DriversLicense', 'Passport', 'BusinessCertificate', 'BusinessLicense'),
      allowNull: false,
    },
    documentNumber: {
      type: DataTypes.STRING,
    },
    documentImage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    verifiedAt: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'seller_documents',
    timestamps: true,
  });

  return SellerDocument;
};
