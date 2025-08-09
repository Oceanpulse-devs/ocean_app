const { where } = require('sequelize');
const {UserTable, SellersTable} = require('../../models')

const currentUserprofile = async(req,res)=>{
  try {
   const id = req.user.id;
   const currentUser = await UserTable.findOne({where:{ id }})
   
   if (!currentUser) {
     return res.status(404).json({message:"User not found"})
   }
   
   const alsoSeller = await SellersTable.findOne({where:{userId:id}})
   const fullName = currentUser.fullName
   const email = currentUser.email
   const role = currentUser.accountType
   const accountStatus = currentUser.accountStatus
   const createdAt = currentUser.createdAt
   let verificationStatus = alsoSeller ? alsoSeller.verificationStatus : null;
   
   // Format join date
   const joinDate = `Joined ${new Date(createdAt).toLocaleDateString('en-US', { 
     month: 'long', 
     year: 'numeric' 
   })}`;
   
   // Basic profile info for all users with actual database values
   const profileInfo = {
     id: currentUser.id,
     fullName, 
     email, 
     role,
     accountStatus,
     createdAt,
     joinDate,
     verificationStatus,
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
     profileInfo.category = alsoSeller.category;
     profileInfo.country = alsoSeller.country;
     profileInfo.state = alsoSeller.state;
     profileInfo.rating = alsoSeller.rating || 0;
     profileInfo.totalSales = alsoSeller.totalSales || 0;
     profileInfo.bio = alsoSeller.businessDescription || "Professional seller on Ocean App";
   }
   
   return res.status(200).json({profileInfo})
   
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({message:"Error fetching user profile", error:error.message})
  }
}

module.exports = currentUserprofile