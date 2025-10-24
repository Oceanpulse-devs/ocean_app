const db = require('./models');

async function debugSellerData() {
  try {
    console.log('🔍 DEBUGGING SELLER DATA...\n');
    
    // Your user ID from the response
    const userId = 'e9d360fc-00d6-4b8e-8c1c-07afe073050c';
    
    console.log('1. Checking all seller records for your user ID:', userId);
    const sellers = await db.SellersTable.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`   Found ${sellers.length} seller record(s):`);
    sellers.forEach((seller, index) => {
      console.log(`   Record ${index + 1}:`);
      console.log(`     ID: ${seller.id}`);
      console.log(`     Business Name: "${seller.businessName}"`);
      console.log(`     Full Name: "${seller.fullName}"`);
      console.log(`     Verification Status: ${seller.verificationStatus}`);
      console.log(`     Created At: ${seller.createdAt}`);
      console.log(`     Updated At: ${seller.updatedAt}`);
      console.log('');
    });
    
    console.log('2. Checking all seller records in the database:');
    const allSellers = await db.SellersTable.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`   Found ${allSellers.length} recent seller record(s):`);
    allSellers.forEach((seller, index) => {
      console.log(`   Record ${index + 1}:`);
      console.log(`     ID: ${seller.id}`);
      console.log(`     User ID: ${seller.userId}`);
      console.log(`     Business Name: "${seller.businessName}"`);
      console.log(`     Full Name: "${seller.fullName}"`);
      console.log(`     Verification Status: ${seller.verificationStatus}`);
      console.log(`     Created At: ${seller.createdAt}`);
      console.log('');
    });
    
    console.log('3. Checking specific seller ID from your response:');
    const specificSellerId = '490213ca-9c5c-4fcb-b603-8de92f73d890';
    const specificSeller = await db.SellersTable.findByPk(specificSellerId);
    
    if (specificSeller) {
      console.log('   Found seller with ID:', specificSellerId);
      console.log(`     Business Name: "${specificSeller.businessName}"`);
      console.log(`     Full Name: "${specificSeller.fullName}"`);
      console.log(`     User ID: ${specificSeller.userId}`);
      console.log(`     Verification Status: ${specificSeller.verificationStatus}`);
      console.log(`     Created At: ${specificSeller.createdAt}`);
      console.log(`     Updated At: ${specificSeller.updatedAt}`);
    } else {
      console.log('   Seller with ID', specificSellerId, 'NOT FOUND');
    }
    
  } catch (error) {
    console.error('❌ Error debugging seller data:', error);
  } finally {
    process.exit(0);
  }
}

debugSellerData();
