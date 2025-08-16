module.exports = (sequelize, DataTypes) => {
  const BuyerNeedResponse = sequelize.define('BuyerNeedResponse', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    buyer_need_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the buyer need being responded to'
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User ID of the seller responding'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Seller\'s response message to the buyer need'
    },
    offer_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Price offered by the seller (if applicable)'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      allowNull: false,
      comment: 'Currency for the offer price'
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired', 'withdrawn'),
      defaultValue: 'pending',
      comment: 'Status of the seller response'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this response is featured'
    },
    response_type: {
      type: DataTypes.ENUM('offer', 'inquiry', 'suggestion', 'other'),
      defaultValue: 'offer',
      comment: 'Type of response from seller'
    },
    delivery_time: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Estimated delivery time offered by seller'
    },
    warranty_info: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Warranty information if applicable'
    },
    return_policy: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Return policy if applicable'
    },
    contact_method: {
      type: DataTypes.ENUM('message', 'email', 'phone', 'meet'),
      allowNull: false,
      comment: 'Preferred contact method for this response'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the buyer has read this response'
    },
    buyer_feedback: {
      type: DataTypes.ENUM('positive', 'neutral', 'negative'),
      allowNull: true,
      comment: 'Buyer feedback on this response'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'buyer_need_responses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['buyer_need_id']
      },
      {
        fields: ['seller_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['created_at']
      },
      {
        unique: true,
        fields: ['buyer_need_id', 'seller_id']
      }
    ]
  });
  
  return BuyerNeedResponse;
};
