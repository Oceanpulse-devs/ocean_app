module.exports = (sequelize, DataTypes) => {
    const SwapDeal = sequelize.define('SwapDeal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Title of the swap deal'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed description of the swap deal'
  },
  initiator_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User ID who initiated the swap offer'
  },
  responder_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User ID who received the swap offer'
  },
  initiator_item_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Product ID of the item offered by initiator'
  },
  responder_item_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Product ID of the item offered by responder'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed'),
    defaultValue: 'pending',
    comment: 'Current status of the swap deal'
  },
  initiator_approval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether initiator has approved the swap'
  },
  responder_approval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether responder has approved the swap'
  },
  swap_terms: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional terms or conditions for the swap'
  },
  meeting_location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Preferred meeting location for item exchange'
  },
  meeting_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Preferred meeting date for item exchange'
  },
  initiator_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message from initiator explaining the swap offer'
  },
  responder_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message from responder about the swap offer'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this swap deal is featured'
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of views on this swap deal'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the swap offer expires'
  },
  isBoosted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_boosted',
    comment: 'Whether swap deal is currently boosted'
  },
  boostExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'boost_expires_at',
    comment: 'When boost expires'
  },
  boostId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'boost_id',
    comment: 'Reference to promotional boost'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'swap_deals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['initiator_id']
    },
    {
      fields: ['responder_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['initiator_item_id']
    },
    {
      fields: ['responder_item_id']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['expires_at']
    }
  ]
  });

  // Define associations
  SwapDeal.associate = function(models) {
    // SwapDeal belongs to User (initiator)
    SwapDeal.belongsTo(models.UserTable, {
      foreignKey: 'initiator_id',
      as: 'initiator'
    });

    // SwapDeal belongs to User (responder)
    SwapDeal.belongsTo(models.UserTable, {
      foreignKey: 'responder_id',
      as: 'responder'
    });

    // SwapDeal belongs to Product (initiator item)
    SwapDeal.belongsTo(models.Product, {
      foreignKey: 'initiator_item_id',
      as: 'initiatorItem'
    });

    // SwapDeal belongs to Product (responder item)
    SwapDeal.belongsTo(models.Product, {
      foreignKey: 'responder_item_id',
      as: 'responderItem'
    });
  };
  
  return SwapDeal;
};
