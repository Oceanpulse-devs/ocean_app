const { where, Op, Sequelize } = require('sequelize');
const db = require('../../models');
const { UserTable, SellersTable, UserFollows, Product, Post, Auction, GroupBuy, SwapDeal, PostLike, ProductLike } = require('../../models');
const { mapRequestFields, mapResponseFields } = require('../../utils/fieldMapper');
const r2StorageService = require('../services/r2StorageService');

const currentUserprofile = async(req,res)=>{
  try {
   const id = req.user.id;
   const currentUser = await UserTable.findOne({where:{ id }})
   
   if (!currentUser) {
     return res.status(404).json({message:"User not found"})
   }
   
   const alsoSeller = await SellersTable.findOne({where:{userId:id}})
   
   // Get follow statistics
   const followersCount = await UserFollows.count({
     where: { followsUserId: id }
   });
   
   const followingCount = await UserFollows.count({
     where: { userId: id }
   });
   
   // Get posts count for all users
   const postsCount = await Post.count({
     where: { userId: id }
   });
   
   // Get products count and featured products only if user is a seller
   let productsCount = 0;
   let featuredProducts = [];
   let auctionsCount = 0;
   let bulkPurchaseCount = 0;
   let distressSalesCount = 0;
   let swapDealsCount = 0;
   let totalViews = 0;
   let totalLikes = 0;
   
   if (alsoSeller) {
     // Use seller's business ID, not user ID
     productsCount = await Product.count({
       where: { sellerId: alsoSeller.id }
     });
     
     // Get featured products (latest 3 products)
     featuredProducts = await Product.findAll({
       where: { 
         sellerId: alsoSeller.id,
         status: 'active',
         isAvailable: true
       },
       order: [['createdAt', 'DESC']],
       limit: 3,
       attributes: ['id', 'title', 'price', 'currency', 'brand', 'location', 'images', 'condition']
     });
     
     // Get auctions count
     auctionsCount = await Auction.count({
       where: { sellerId: alsoSeller.id }
     });
     
     // Get group buys count (bulk purchase)
     bulkPurchaseCount = await GroupBuy.count({
       where: { creator_id: id }
     });
     
     // Get distress sales count (products with isDistressSale: true)
     distressSalesCount = await Product.count({
       where: { 
         sellerId: alsoSeller.id,
         isDistressSale: true,
         status: 'active'
       }
     });
     
     // Get swap deals count
     swapDealsCount = await SwapDeal.count({
       where: { sellerId: id }
     });
     
     // Calculate total views from all seller items
     const [productViews] = await db.sequelize.query(
       `SELECT COALESCE(SUM(views), 0) as total FROM products WHERE sellerId = :sellerId`,
       { replacements: { sellerId: alsoSeller.id }, type: Sequelize.QueryTypes.SELECT }
     );
     const [auctionViews] = await db.sequelize.query(
       `SELECT COALESCE(SUM(views), 0) as total FROM auctions WHERE sellerId = :sellerId`,
       { replacements: { sellerId: alsoSeller.id }, type: Sequelize.QueryTypes.SELECT }
     );
     const [groupBuyViews] = await db.sequelize.query(
       `SELECT COALESCE(SUM(views_count), 0) as total FROM group_buys WHERE creator_id = :creatorId`,
       { replacements: { creatorId: id }, type: Sequelize.QueryTypes.SELECT }
     );
     const [swapDealViews] = await db.sequelize.query(
       `SELECT COALESCE(SUM(views_count), 0) as total FROM swap_deals WHERE seller_id = :sellerId`,
       { replacements: { sellerId: id }, type: Sequelize.QueryTypes.SELECT }
     );
     
     totalViews = (parseInt(productViews?.total || 0) + 
                   parseInt(auctionViews?.total || 0) + 
                   parseInt(groupBuyViews?.total || 0) + 
                   parseInt(swapDealViews?.total || 0));
     
     // Calculate total likes from all seller items
     // Count ProductLike records (not SUM of likes field)
     const productLikesCount = await ProductLike.count({
       include: [{
         model: Product,
         as: 'product',
         where: { sellerId: alsoSeller.id },
         required: true
       }]
     });
     
     const [postLikes] = await db.sequelize.query(
       `SELECT COUNT(*) as total FROM postlikes pl 
        INNER JOIN posts p ON pl.postId = p.id 
        WHERE p.userId = :userId`,
       { replacements: { userId: id }, type: Sequelize.QueryTypes.SELECT }
     );
     
     totalLikes = productLikesCount + parseInt(postLikes?.total || 0);
   }
   
   const fullName = currentUser.fullName
   const email = currentUser.email
   const username = currentUser.username || `@${currentUser.fullName.toLowerCase().replace(/\s+/g, '_')}`
   const role = currentUser.accountType
   const accountStatus = currentUser.accountStatus
   const createdAt = currentUser.createdAt
   const lastActive = currentUser.lastActive || currentUser.updatedAt
   let verificationStatus = alsoSeller ? alsoSeller.verificationStatus : null;
   
   // Format join date
   const joinDate = `Joined ${new Date(createdAt).toLocaleDateString('en-US', { 
     month: 'long', 
     year: 'numeric' 
   })}`;
   
   // Format last active date
   const lastActiveFormatted = lastActive ? 
     `${new Date(lastActive).getDate()}${getOrdinalSuffix(new Date(lastActive).getDate())} ${new Date(lastActive).toLocaleDateString('en-US', { month: 'long' })}, ${new Date(lastActive).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` :
     'Recently';
   
   // Helper function for ordinal suffixes
   function getOrdinalSuffix(day) {
     if (day >= 11 && day <= 13) return 'th';
     switch (day % 10) {
       case 1: return 'st';
       case 2: return 'nd';
       case 3: return 'rd';
       default: return 'th';
     }
   }
   
   // Basic profile info for all users with actual database values
   const profileInfo = {
     id: currentUser.id,
     fullName, 
     email,
     username,
     role, // Current role for permissions
     accountType: role, // Account classification (same as role for now)
     accountStatus,
     createdAt,
     joinDate,
     lastActive: lastActiveFormatted,
     verificationStatus,
     // Social stats
     followersCount,
     followingCount,
     postsCount, // NEW: Count of posts created by user (all users)
     productsCount,
     featuredProducts,
     // Use actual database values with fallbacks
     profilePicture: r2StorageService.sanitizePublicUrl(currentUser.profilePicture) || "/default-avatar.jpg",
     coverPicture: r2StorageService.sanitizePublicUrl(currentUser.coverPicture) || "/default-cover.jpg",
     bio: currentUser.bio || (role === "seller" ? "Professional seller on BlueWhale" : "BlueWhale user"),
     location: currentUser.location || "Not specified",
     website: currentUser.website || null,
     // Add missing fields that frontend expects
     emailVerified: currentUser.emailVerified || false,
     phoneNumber: currentUser.phoneNumber || null,
     updatedAt: currentUser.updatedAt
   }

   // Add seller-specific info if user is a seller
   if(role === "seller" && alsoSeller){
     profileInfo.businessName = alsoSeller.businessName || fullName;
     profileInfo.businessAddress = alsoSeller.businessAddress;
     profileInfo.businessDescription = alsoSeller.businessDescription;
     profileInfo.sellerType = alsoSeller.sellerType;
     profileInfo.selectedCategories = alsoSeller.selectedCategories || [];
     profileInfo.selectedSubcategories = alsoSeller.selectedSubcategories || {};
     profileInfo.businessEmail = alsoSeller.businessEmail;
     profileInfo.businessPhone = alsoSeller.businessPhone;
     profileInfo.category = alsoSeller.category;
     profileInfo.country = alsoSeller.country;
     profileInfo.state = alsoSeller.state;
     profileInfo.rating = alsoSeller.rating || 0;
     profileInfo.totalSales = alsoSeller.totalSales || 0;
     profileInfo.bio = alsoSeller.businessDescription || "Professional seller on BlueWhale";
     
     // NEW: Add seller-specific tab counts
     profileInfo.auctionsCount = auctionsCount;
     profileInfo.bulkPurchaseCount = bulkPurchaseCount;
     profileInfo.distressSalesCount = distressSalesCount;
     profileInfo.swapDealsCount = swapDealsCount;
     profileInfo.totalViews = totalViews;
     profileInfo.totalLikes = totalLikes;
   }
   
   // Profile response structure matches frontend expectations
   return res.status(200).json({
     message: "Profile retrieved successfully",
     user: profileInfo // Frontend expects 'user' key (middleware will add 'success' flag)
   })
   
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({message:"Error fetching user profile", error:error.message})
  }
};

// Get any user's profile by ID (accepts both User ID and Seller Table ID)
const getUserProfileById = async(req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID or Seller ID is required" });
    }
    
    // Try to find user by User ID first
    let user = await UserTable.findOne({ where: { id: userId } });
    let actualUserId = userId; // Will be set to User ID
    
    // If not found as User ID, try as Seller Table ID or Seller Table userId
    if (!user) {
      let seller = await SellersTable.findByPk(userId);
      if (!seller) {
        seller = await SellersTable.findOne({ where: { userId: userId } });
      }
      if (seller) {
        actualUserId = seller.userId; // Get User ID from seller record
        user = await UserTable.findOne({ where: { id: actualUserId } });
        if (!user) {
          return res.status(404).json({ success: false, message: "User associated with seller not found" });
        }
      } else {
        return res.status(404).json({ success: false, message: "User or seller not found" });
      }
    }

    // 🔒 Block Check: Hide profile if either user has blocked the other
    if (req.user && req.user.id && actualUserId) {
      const { getBlockedUserIds } = require('../utils/userBlockHelper');
      const blockedIds = await getBlockedUserIds(req.user.id);
      if (blockedIds.includes(actualUserId)) {
        return res.status(404).json({ success: false, message: "User profile unavailable" });
      }
    }
    
    // Use actualUserId for all subsequent queries
    const alsoSeller = await SellersTable.findOne({ where: { userId: actualUserId } });
    const fullName = user.fullName;
    const role = user.accountType;
    const accountStatus = user.accountStatus;
    const createdAt = user.createdAt;
    let verificationStatus = alsoSeller ? alsoSeller.verificationStatus : null;
    
    // Get follow statistics (use actualUserId)
    const followersCount = await UserFollows.count({
      where: { followsUserId: actualUserId }
    });
    
    const followingCount = await UserFollows.count({
      where: { userId: actualUserId }
    });
    
    // Check if current user is following this profile
    let isFollowing = false;
    if (req.user && req.user.id) {
      const followStatus = await UserFollows.findOne({
        where: {
          userId: req.user.id,
          followsUserId: actualUserId
        }
      });
      isFollowing = !!followStatus;
    }
    
    // Get posts count for all users (use actualUserId)
    const postsCount = await Post.count({
      where: { userId: actualUserId }
    });
    
    // Get products count and seller-specific counts only if user is a seller
    let productsCount = 0;
    let auctionsCount = 0;
    let bulkPurchaseCount = 0;
    let distressSalesCount = 0;
    let swapDealsCount = 0;
    let totalViews = 0;
    let totalLikes = 0;
    
    if (alsoSeller) {
      // Use seller's business ID, not user ID
      productsCount = await Product.count({
        where: { sellerId: alsoSeller.id }
      });
      
      // Get auctions count
      auctionsCount = await Auction.count({
        where: { sellerId: alsoSeller.id }
      });
      
      // Get group buys count (bulk purchase) - use actualUserId
      bulkPurchaseCount = await GroupBuy.count({
        where: { creator_id: actualUserId }
      });
      
      // Get distress sales count (products with isDistressSale: true)
      distressSalesCount = await Product.count({
        where: { 
          sellerId: alsoSeller.id,
          isDistressSale: true,
          status: 'active'
        }
      });
      
      // Get swap deals count - use actualUserId
      swapDealsCount = await SwapDeal.count({
        where: { sellerId: actualUserId }
      });
      
      // Calculate total views from all seller items
      const [productViews] = await db.sequelize.query(
        `SELECT COALESCE(SUM(views), 0) as total FROM products WHERE sellerId = :sellerId`,
        { replacements: { sellerId: alsoSeller.id }, type: Sequelize.QueryTypes.SELECT }
      );
      const [auctionViews] = await db.sequelize.query(
        `SELECT COALESCE(SUM(views), 0) as total FROM auctions WHERE sellerId = :sellerId`,
        { replacements: { sellerId: alsoSeller.id }, type: Sequelize.QueryTypes.SELECT }
      );
      const [groupBuyViews] = await db.sequelize.query(
        `SELECT COALESCE(SUM(views_count), 0) as total FROM group_buys WHERE creator_id = :creatorId`,
        { replacements: { creatorId: actualUserId }, type: Sequelize.QueryTypes.SELECT }
      );
      const [swapDealViews] = await db.sequelize.query(
        `SELECT COALESCE(SUM(views_count), 0) as total FROM swap_deals WHERE seller_id = :sellerId`,
        { replacements: { sellerId: actualUserId }, type: Sequelize.QueryTypes.SELECT }
      );
      
      totalViews = (parseInt(productViews?.total || 0) + 
                    parseInt(auctionViews?.total || 0) + 
                    parseInt(groupBuyViews?.total || 0) + 
                    parseInt(swapDealViews?.total || 0));
      
      // Calculate total likes from all seller items
      const productLikesCount = await ProductLike.count({
        include: [{
          model: Product,
          as: 'product',
          where: { sellerId: alsoSeller.id },
          required: true
        }]
      });
      
      const [postLikes] = await db.sequelize.query(
        `SELECT COUNT(*) as total FROM postlikes pl 
         INNER JOIN posts p ON pl.postId = p.id 
         WHERE p.userId = :userId`,
        { replacements: { userId: actualUserId }, type: Sequelize.QueryTypes.SELECT }
      );
      
      totalLikes = productLikesCount + parseInt(postLikes?.total || 0);
    }
    
    // Format join date
    const joinDate = `Joined ${new Date(createdAt).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })}`;
    
    // Basic profile info for all users with actual database values
    const profileInfo = {
      id: user.id,
      email: user.email || null,
      fullName, 
      phoneNumber: user.phoneNumber || (alsoSeller ? (alsoSeller.phoneNumber || alsoSeller.businessPhone) : null),
      role: role || (alsoSeller ? 'seller' : 'user'),
      accountStatus,
      createdAt,
      joinDate,
      verificationStatus: verificationStatus || 'approved',
      followersCount,
      followingCount,
      postsCount,
      productsCount,
      isFollowing,
      profilePicture: r2StorageService.sanitizePublicUrl(user.profilePicture) || "/default-avatar.jpg",
      coverPicture: r2StorageService.sanitizePublicUrl(user.coverPicture) || "/default-cover.jpg",
      bio: user.bio || (role === "seller" ? "Professional seller on BlueWhale" : "BlueWhale user"),
      location: user.location || "Not specified",
      website: user.website || null
    };

    // Add seller-specific info if user is a seller
    if (role === "seller" || alsoSeller) {
      profileInfo.sellerId = alsoSeller ? alsoSeller.id : null;
      profileInfo.businessName = alsoSeller?.businessName || user.businessName || fullName;
      profileInfo.businessDescription = alsoSeller?.businessDescription || "Leading seller on BlueWhale Marketplace";
      profileInfo.businessEmail = alsoSeller?.email || alsoSeller?.businessEmail || user.email || null;
      profileInfo.businessPhone = alsoSeller?.phoneNumber || alsoSeller?.businessPhone || user.phoneNumber || null;
      profileInfo.businessAddress = alsoSeller?.businessAddress || null;
      profileInfo.businessLocation = alsoSeller?.state 
        ? (alsoSeller?.country ? `${alsoSeller.state}, ${alsoSeller.country}` : `${alsoSeller.state}, Nigeria`)
        : (user.location || alsoSeller?.businessAddress || null);
      profileInfo.businessWebsite = alsoSeller?.website || user.website || null;
      profileInfo.country = alsoSeller?.country || "Nigeria";
      profileInfo.state = alsoSeller?.state || user.location || null;
      profileInfo.sellerType = alsoSeller?.sellerType || "retailer";
      profileInfo.selectedCategories = alsoSeller?.selectedCategories || [];
      profileInfo.selectedSubcategories = alsoSeller?.selectedSubcategories || {};
      profileInfo.category = alsoSeller?.category || null;
      profileInfo.rating = parseFloat(alsoSeller?.rating) || 4.9;
      profileInfo.totalReviews = alsoSeller?.totalReviews || 0;
      profileInfo.totalSales = alsoSeller?.totalSales || 0;
      profileInfo.bio = alsoSeller?.businessDescription || "Professional seller on BlueWhale";
      
      // Seller tab counts and totals
      profileInfo.auctionsCount = auctionsCount;
      profileInfo.bulkPurchaseCount = bulkPurchaseCount;
      profileInfo.distressSalesCount = distressSalesCount;
      profileInfo.swapDealsCount = swapDealsCount;
      profileInfo.totalViews = totalViews;
      profileInfo.totalLikes = totalLikes;
    }
    
    return res.status(200).json({ 
      success: true,
      message: "User profile fetched",
      data: profileInfo 
    });
    
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
}

module.exports = { currentUserprofile, getUserProfileById }