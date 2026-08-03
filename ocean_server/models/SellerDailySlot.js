module.exports = (sequelize, DataTypes) => {
  const SellerDailySlot = sequelize.define('SellerDailySlot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'seller_id',
      comment: 'User ID of the seller'
    },
    dailySlotsTotal: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      field: 'daily_slots_total',
      comment: 'Total daily Express Interest slots (3 max globally)'
    },
    dailySlotsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'daily_slots_used',
      comment: 'Slots used today by the seller'
    },
    lastResetDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      field: 'last_reset_date',
      comment: 'Date when the slot counter was last reset'
    }
  }, {
    tableName: 'seller_daily_slots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['seller_id']
      }
    ]
  });

  SellerDailySlot.associate = function(models) {
    SellerDailySlot.belongsTo(models.UserTable, {
      foreignKey: 'sellerId',
      as: 'seller'
    });
  };

  return SellerDailySlot;
};
