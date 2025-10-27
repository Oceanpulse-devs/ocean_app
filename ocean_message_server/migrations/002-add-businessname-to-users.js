'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists
    const tableExists = async (tableName) => {
      try {
        await queryInterface.describeTable(tableName);
        return true;
      } catch (error) {
        return false;
      }
    };

    // Check if the column already exists in the users table
    const columnExists = async (tableName, columnName) => {
      if (await tableExists(tableName)) {
        const tableDescription = await queryInterface.describeTable(tableName);
        return tableDescription.hasOwnProperty(columnName);
      }
      return false;
    };

    if (await tableExists('users')) {
      if (!(await columnExists('users', 'businessName'))) {
        console.log('Adding businessName column to users table...');
        await queryInterface.addColumn('users', 'businessName', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Business name for sellers'
        });
        console.log('✅ businessName column added to users table');
      } else {
        console.log('businessName column already exists in users table');
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableExists = async (tableName) => {
      try {
        await queryInterface.describeTable(tableName);
        return true;
      } catch (error) {
        return false;
      }
    };

    if (await tableExists('users')) {
      console.log('Removing businessName column from users table...');
      await queryInterface.removeColumn('users', 'businessName');
      console.log('✅ businessName column removed from users table');
    }
  }
};

