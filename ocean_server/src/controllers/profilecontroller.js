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
   const username = currentUser.username
   const profilePicture = currentUser.profilePicture
   const coverPicture = currentUser.coverPicture
   const email = currentUser.email
   const role = currentUser.accountType
   let verificationStatus = alsoSeller ? alsoSeller.verificationStatus : null;
   
   // Basic profile info for all users
   const profileInfo = {
     username, 
     profilePicture, 
     coverPicture, 
     email, 
     role,
     verificationStatus
   }

   // Add seller-specific info if user is a seller
   if(role === "seller" && alsoSeller){
     profileInfo.businessName = alsoSeller.businessName;
     profileInfo.businessAddress = alsoSeller.businessAddress;
     profileInfo.category = alsoSeller.category;
     profileInfo.country = alsoSeller.country;
     profileInfo.state = alsoSeller.state;
     profileInfo.rating = alsoSeller.rating;
     profileInfo.totalSales = alsoSeller.totalSales;
   }
   
   return res.status(200).json({profileInfo})
   
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({message:"Error fetching user profile", error:error.message})
  }
}

module.exports = currentUserprofile