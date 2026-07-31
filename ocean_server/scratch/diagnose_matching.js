const db = require('./models');
const { Op } = require('sequelize');

async function diagnose() {
    try {
        console.log('🔍 Starting matching diagnostics...');
        
        // 1. Fetch all sellers besides the buyer
        const buyerId = '9c03816f-279b-482a-937d-42ec47a13897';
        const sellers = await db.SellersTable.findAll({
            where: {
                userId: { [Op.ne]: buyerId }
            },
            include: [{ model: db.UserTable, as: 'user' }]
        });

        console.log(`📋 Found ${sellers.length} other seller(s) in the database:`);
        
        for (const seller of sellers) {
            console.log('\n----------------------------------------');
            console.log(`👤 Seller: ${seller.fullName} (Business: "${seller.businessName}")`);
            console.log(`🔹 User ID: ${seller.userId}`);
            console.log(`🔹 Verification Status: "${seller.verificationStatus}" (Needs to be 'approved' or 'active')`);
            console.log(`🔹 Location: Country = "${seller.country}", State = "${seller.state}"`);
            console.log(`🔹 Selected Categories (raw):`, seller.selectedCategories);
            
            const user = seller.user;
            if (!user) {
                console.log(`❌ Error: No user table entry found for this seller!`);
                continue;
            }

            console.log(`🔹 User Account Status: "${user.accountStatus}"`);
            console.log(`🔹 User Current Plan ID: ${user.currentPlanId}`);

            // Check plan details
            if (user.currentPlanId) {
                const plan = await db.SubscriptionPlan.findByPk(user.currentPlanId);
                if (plan) {
                    console.log(`🔹 Subscribed Plan Name: "${plan.name}" (Display: "${plan.displayName}")`);
                    console.log(`🔹 Max Daily Notifications (Leads): ${plan.maxDailyNotifications}`);
                } else {
                    console.log(`❌ Error: Plan ID ${user.currentPlanId} does not exist in subscription_plans table!`);
                }
            } else {
                console.log(`⚠️ Warning: Seller has no currentPlanId set (defaults to Free = 0 leads).`);
            }

            // Test Category Match against 'Agriculture & Food'
            const categoryName = 'Agriculture & Food';
            let categories = [];
            try {
                categories = typeof seller.selectedCategories === 'string' 
                    ? JSON.parse(seller.selectedCategories) 
                    : seller.selectedCategories || [];
            } catch (e) {
                categories = [seller.selectedCategories];
            }

            const jsonContains = categories.some(cat => String(cat).toLowerCase() === categoryName.toLowerCase());
            const likeMatch = String(seller.selectedCategories).toLowerCase().includes(categoryName.toLowerCase());
            
            console.log(`🔹 Category Match Test for "${categoryName}":`);
            console.log(`   - JSON Exact Case-Insensitive Match: ${jsonContains ? '✅ MATCH' : '❌ NO MATCH'}`);
            console.log(`   - SQL LIKE Substring Match: ${likeMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        }
        
    } catch (err) {
        console.error('❌ Diagnostics failed:', err);
    } finally {
        process.exit(0);
    }
}

diagnose();
