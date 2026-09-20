const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SellerVerificationLog = sequelize.define('SellerVerificationLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of the seller record if created'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of the user initiating verification'
    },
    verificationType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'NIN_DOJAH',
      comment: 'Type of automated verification (e.g. NIN_DOJAH)'
    },
    ninNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'NIN string submitted'
    },
    nimcFirstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nimcLastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nimcDob: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nimcPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nimcState: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nimcPhotoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'NIMC photo URL or base64 photo reference'
    },
    dojahReferenceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tracking or Reference ID returned by Dojah API'
    },
    confidenceScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Name & DOB similarity matching score (0-100)'
    },
    status: {
      type: DataTypes.ENUM('approved', 'flagged_mismatch', 'rejected', 'failed', 'pending'),
      defaultValue: 'pending',
      comment: 'Verification status outcome'
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason if verification failed or was flagged'
    },
    rawResponse: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Full raw JSON payload returned by Dojah for audit compliance'
    }
  }, {
    tableName: 'seller_verification_logs',
    timestamps: true,
  });

  SellerVerificationLog.associate = (models) => {
    if (models.SellersTable) {
      SellerVerificationLog.belongsTo(models.SellersTable, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
    if (models.UserTable) {
      SellerVerificationLog.belongsTo(models.UserTable, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };

  return SellerVerificationLog;
};
