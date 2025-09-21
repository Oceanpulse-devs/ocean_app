'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting migration: Update SellerDocument to allow null documentImage...');
      
      // Update the documentImage column to allow NULL
      await queryInterface.changeColumn('seller_documents', 'documentImage', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL or path to document image (optional for NIN documents)'
      });
      
      console.log('✅ Updated documentImage column to allow NULL');
      
      // Update the documentType enum to include new document types
      await queryInterface.changeColumn('seller_documents', 'documentType', {
        type: Sequelize.ENUM(
          'NIN', 
          'ElectricBill', 
          'IDCard', 
          'DriversLicense', 
          'Passport', 
          'BusinessCertificate', 
          'BusinessLicense', 
          'TaxCertificate', 
          'BankStatement', 
          'UtilityBill', 
          'InsuranceCertificate', 
          'Other'
        ),
        allowNull: false
      });
      
      console.log('✅ Updated documentType enum with new document types');
      console.log('Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Rolling back migration: Update SellerDocument...');
      
      // Revert documentImage column to NOT NULL
      await queryInterface.changeColumn('seller_documents', 'documentImage', {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'URL or path to document image'
      });
      
      console.log('✅ Reverted documentImage column to NOT NULL');
      
      // Revert documentType enum to original values
      await queryInterface.changeColumn('seller_documents', 'documentType', {
        type: Sequelize.ENUM(
          'NIN', 
          'DriversLicense', 
          'Passport', 
          'BusinessCertificate', 
          'BusinessLicense', 
          'TaxCertificate', 
          'BankStatement', 
          'UtilityBill', 
          'InsuranceCertificate', 
          'Other'
        ),
        allowNull: false
      });
      
      console.log('✅ Reverted documentType enum to original values');
      console.log('Rollback completed successfully!');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};



