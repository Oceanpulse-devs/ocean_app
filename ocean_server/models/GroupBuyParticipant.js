module.exports = (sequelize, DataTypes) => {
    const GroupBuyParticipant = sequelize.define('GroupBuyParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  group_buy_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the group buy'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the user joining the group buy'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Quantity of items the user wants to buy'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending',
    comment: 'Status of the user\'s participation'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    defaultValue: 'pending',
    comment: 'Payment status for this participation'
  },
  payment_method: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Payment method used'
  },
  payment_reference: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Payment reference number'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Total amount for this participation (quantity * group_price)'
  },
  pickup_location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Preferred pickup location for this user'
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Delivery address if delivery is preferred'
  },
  special_requests: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Any special requests from the user'
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'When the user joined the group buy'
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the participation was confirmed'
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the participation was cancelled'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the participation was completed'
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
  tableName: 'group_buy_participants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['group_buy_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_status']
    },
    {
      unique: true,
      fields: ['group_buy_id', 'user_id']
    }
  ]
  });
  
  return GroupBuyParticipant;
};
