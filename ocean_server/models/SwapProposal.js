module.exports = (sequelize, DataTypes) => {
    const SwapProposal = sequelize.define('SwapProposal', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  swapDealId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'swap_deal_id',
    comment: 'Reference to the swap deal'
  },
  proposerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'proposer_id',
    comment: 'User ID who proposed the swap'
  },
  proposerItemName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'proposer_item_name',
    comment: 'Name of the item being offered'
  },
  proposerItemDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'proposer_item_description',
    comment: 'Description of the item being offered'
  },
  proposerItemImages: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'proposer_item_images',
    comment: 'Images of the item being offered'
  },
  proposerItemCondition: {
    type: DataTypes.ENUM('new', 'like_new', 'good', 'fair', 'poor'),
    defaultValue: 'good',
    field: 'proposer_item_condition',
    comment: 'Condition of the item being offered'
  },
  proposerMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'proposer_message',
    comment: 'Message from proposer explaining the swap offer'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
    defaultValue: 'pending',
    comment: 'Current status of the swap proposal'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'createdAt'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updatedAt'
  }
}, {
  tableName: 'swap_proposals',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['swap_deal_id']
    },
    {
      fields: ['proposer_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
  });

  // Define associations
  SwapProposal.associate = function(models) {
    // SwapProposal belongs to SwapDeal
    SwapProposal.belongsTo(models.SwapDeal, {
      foreignKey: 'swapDealId',
      as: 'swapDeal'
    });

    // SwapProposal belongs to User (proposer)
    SwapProposal.belongsTo(models.UserTable, {
      foreignKey: 'proposerId',
      as: 'proposer'
    });
  };
  
  return SwapProposal;
};
