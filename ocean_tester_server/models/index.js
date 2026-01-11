const { sequelize } = require('../config/database');
const SellerTester = require('./SellerTester');
const BuyerTester = require('./BuyerTester');
const Feedback = require('./Feedback');

// Export models
module.exports = {
  sequelize,
  SellerTester,
  BuyerTester,
  Feedback
};
