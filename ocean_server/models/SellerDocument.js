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
      field: 'seller_id',  // Map to snake_case column name in database
    },
    documentType: {
      type: DataTypes.ENUM('NIN', 'ElectricBill', 'IDCard', 'DriversLicense', 'Passport', 'BusinessCertificate', 'BusinessLicense', 'TaxCertificate', 'BankStatement', 'UtilityBill', 'InsuranceCertificate', 'Other'),
      allowNull: false,
      field: 'document_type',
    },
    documentNumber: {
      type: DataTypes.STRING,
      field: 'document_number',
      comment: 'Official document number/ID'
    },
    documentImage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'document_image',
      comment: 'URL or path to document image (optional for NIN documents)'
    },
    documentBackImage: {
      type: DataTypes.TEXT,
      field: 'document_back_image',
      comment: 'URL or path to back side of document if applicable'
    },
    documentExpiryDate: {
      type: DataTypes.DATE,
      field: 'document_expiry_date',
      comment: 'When the document expires'
    },
    documentIssuingAuthority: {
      type: DataTypes.STRING,
      field: 'document_issuing_authority',
      comment: 'Authority that issued the document'
    },
    documentCountry: {
      type: DataTypes.STRING,
      field: 'document_country',
      comment: 'Country where document was issued'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired', 'under_review'),
      defaultValue: 'pending',
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'submitted_at',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      field: 'verified_at',
    },
    verifiedBy: {
      type: DataTypes.UUID,
      field: 'verified_by',
      comment: 'Admin user who verified this document'
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      field: 'verification_notes',
      comment: 'Admin notes about document verification'
    },
    // rejectionReason: {
    //   type: DataTypes.TEXT,
    //   comment: 'Reason for rejection if document was rejected'
    // },
    // Temporarily commented out until database schema is updated
    // documentScore: {
    //   type: DataTypes.INTEGER,
    //   defaultValue: 0,
    //   comment: 'Verification score for this document (0-100)'
    // },
    // isExpired: {
    //   type: DataTypes.BOOLEAN,
    //   defaultValue: false,
    //   comment: 'Whether the document has expired'
    // },
    // requiresRenewal: {
    //   type: DataTypes.BOOLEAN,
    //   defaultValue: false,
    //   comment: 'Whether document needs renewal'
    // }
  }, {
    tableName: 'seller_documents',
    timestamps: true,
  });

  // Define associations
  SellerDocument.associate = (models) => {
    SellerDocument.belongsTo(models.SellersTable, {
      foreignKey: 'sellerId',
      as: 'seller'
    });
  };

  return SellerDocument;
};
