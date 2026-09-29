'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Running migration: Expanding messages.reference_type ENUM to include story and market_update...');
    await queryInterface.sequelize.query(`
      ALTER TABLE \`messages\` 
      MODIFY COLUMN \`reference_type\` ENUM(
        'buyer_need',
        'product',
        'swap_deal',
        'distress_sale',
        'auction',
        'story',
        'market_update'
      ) NULL DEFAULT NULL;
    `);
    console.log('✅ Migration complete: reference_type ENUM updated successfully.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE \`messages\` 
      MODIFY COLUMN \`reference_type\` ENUM(
        'buyer_need',
        'product',
        'swap_deal',
        'distress_sale',
        'auction'
      ) NULL DEFAULT NULL;
    `);
  }
};
