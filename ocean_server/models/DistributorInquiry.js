const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DistributorInquiry = sequelize.define('DistributorInquiry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    inquirerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Reference to the user making the inquiry'
    },
    distributorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'heavy_distributors',
        key: 'id'
      },
      comment: 'Reference to the heavy distributor being inquired about'
    },
    inquiryType: {
      type: DataTypes.ENUM('product_inquiry', 'pricing_inquiry', 'bulk_order', 'partnership', 'general', 'custom'),
      allowNull: false,
      comment: 'Type of inquiry being made'
    },
    customInquiryType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Custom inquiry type if not covered by predefined types'
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Subject/title of the inquiry'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Detailed inquiry message'
    },
    productCategories: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Product categories the inquirer is interested in'
    },
    productBrands: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Specific product brands the inquirer is looking for'
    },
    quantityNeeded: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of products needed'
    },
    budgetRange: {
      type: DataTypes.ENUM('under_10k', '10k_50k', '50k_100k', '100k_500k', '500k_1m', 'over_1m'),
      allowNull: true,
      comment: 'Budget range for the inquiry'
    },
    urgencyLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      comment: 'Urgency level of the inquiry'
    },
    preferredContactMethod: {
      type: DataTypes.ENUM('email', 'phone', 'whatsapp', 'in_person', 'any'),
      defaultValue: 'any',
      comment: 'Preferred method of contact'
    },
    preferredContactTime: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Preferred contact time and days'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Location where the inquirer is based'
    },
    deliveryRequirements: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Specific delivery requirements or preferences'
    },
    additionalFiles: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of file attachments (quotes, specifications, etc.)'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'responded', 'closed', 'cancelled'),
      defaultValue: 'pending',
      comment: 'Current status of the inquiry'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      comment: 'Priority level assigned to the inquiry'
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Staff member assigned to handle this inquiry'
    },
    responseDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Deadline for responding to the inquiry'
    },
    lastResponseDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of the last response'
    },
    responseCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of responses to this inquiry'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the inquiry has been read by the distributor'
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the inquiry has been archived'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Tags for categorizing and organizing inquiries'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal notes about the inquiry'
    }
  }, {
    tableName: 'distributor_inquiries',
    timestamps: true,
    indexes: [
      {
        fields: ['inquirerId']
      },
      {
        fields: ['distributorId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['urgencyLevel']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  DistributorInquiry.associate = (models) => {
    if (models.UserTable) {
      DistributorInquiry.belongsTo(models.UserTable, {
        foreignKey: 'inquirerId',
        as: 'inquirer'
      });
    }
    
    if (models.HeavyDistributor) {
      DistributorInquiry.belongsTo(models.HeavyDistributor, {
        foreignKey: 'distributorId',
        as: 'distributor'
      });
    }
  };

  return DistributorInquiry;
};
