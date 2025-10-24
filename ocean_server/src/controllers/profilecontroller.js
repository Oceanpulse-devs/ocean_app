const { where, Op } = require('sequelize');
const {UserTable, SellersTable, UserFollows, Product} = require('../../models')

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
   
   // Get products count and featured products only if user is a seller
   let productsCount = 0;
   let featuredProducts = [];
   
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
     productsCount,
     featuredProducts,
     // Use actual database values with fallbacks
     profilePicture: currentUser.profilePicture || "/default-avatar.jpg",
     coverPicture: currentUser.coverPicture || "/default-cover.jpg",
     bio: currentUser.bio || (role === "seller" ? "Professional seller on Ocean App" : "Ocean App user"),
     location: currentUser.location || "Not specified",
     website: currentUser.website || null
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
     profileInfo.bio = alsoSeller.businessDescription || "Professional seller on Ocean App";
   }
   
   return res.status(200).json({
     message: "Profile retrieved successfully",
     user: profileInfo
   })
   
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({message:"Error fetching user profile", error:error.message})
  }
};

// Get any user's profile by ID
const getUserProfileById = async(req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const user = await UserTable.findOne({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const alsoSeller = await SellersTable.findOne({ where: { userId: userId } });
    const fullName = user.fullName;
    const role = user.accountType;
    const accountStatus = user.accountStatus;
    const createdAt = user.createdAt;
    let verificationStatus = alsoSeller ? alsoSeller.verificationStatus : null;
    
    // Format join date
    const joinDate = `Joined ${new Date(createdAt).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })}`;
    
    // Basic profile info for all users with actual database values
    const profileInfo = {
      id: user.id,
      fullName, 
      role,
      accountStatus,
      createdAt,
      joinDate,
      verificationStatus,
      // Use actual database values with fallbacks
      profilePicture: user.profilePicture || "/default-avatar.jpg",
      coverPicture: user.coverPicture || "/default-cover.jpg",
      bio: user.bio || (role === "seller" ? "Professional seller on Ocean App" : "Ocean App user"),
      location: user.location || "Not specified",
      website: user.website || null
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
      profileInfo.bio = alsoSeller.businessDescription || "Professional seller on Ocean App";
    }
    
    return res.status(200).json({ 
      message: "Profile retrieved successfully",
      data: profileInfo 
    });
    
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
}

module.exports = { currentUserprofile, getUserProfileById }