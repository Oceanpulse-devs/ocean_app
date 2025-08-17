const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DistributorReview = sequelize.define('DistributorReview', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    distributorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'heavy_distributors',
        key: 'id'
      },
      comment: 'Reference to the heavy distributor being reviewed'
    },
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Reference to the user writing the review'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Rating from 1 to 5 stars'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Review title/summary'
    },
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Detailed review content'
    },
    orderExperience: {
      type: DataTypes.ENUM('excellent', 'good', 'average', 'poor', 'terrible'),
      allowNull: true,
      comment: 'Overall order experience rating'
    },
    deliveryExperience: {
      type: DataTypes.ENUM('excellent', 'good', 'average', 'poor', 'terrible'),
      allowNull: true,
      comment: 'Delivery experience rating'
    },
    productQuality: {
      type: DataTypes.ENUM('excellent', 'good', 'average', 'poor', 'terrible'),
      allowNull: true,
      comment: 'Product quality rating'
    },
    customerService: {
      type: DataTypes.ENUM('excellent', 'good', 'average', 'poor', 'terrible'),
      allowNull: true,
      comment: 'Customer service rating'
    },
    pricingRating: {
      type: DataTypes.ENUM('excellent', 'good', 'average', 'poor', 'terrible'),
      allowNull: true,
      comment: 'Pricing competitiveness rating'
    },
    orderId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Reference to the order this review is based on'
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of the order being reviewed'
    },
    isVerifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this review is from a verified purchase'
    },
    isHelpful: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of users who found this review helpful'
    },
    isNotHelpful: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of users who found this review not helpful'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
      defaultValue: 'pending',
      comment: 'Review moderation status'
    },
    moderatorNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes from moderators about the review'
    },
    flaggedReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason if review was flagged for moderation'
    }
  }, {
    tableName: 'distributor_reviews',
    timestamps: true,
    indexes: [
      {
        fields: ['distributorId']
      },
      {
        fields: ['reviewerId']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  DistributorReview.associate = (models) => {
    if (models.HeavyDistributor) {
      DistributorReview.belongsTo(models.HeavyDistributor, {
        foreignKey: 'distributorId',
        as: 'distributor'
      });
    }
    
    if (models.UserTable) {
      DistributorReview.belongsTo(models.UserTable, {
        foreignKey: 'reviewerId',
        as: 'reviewer'
      });
    }
  };

  return DistributorReview;
};
