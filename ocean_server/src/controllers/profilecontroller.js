const { where } = require('sequelize');
const {UserTable, SellersTable} = require('../../models')

const currentUserprofile = async(req,res)=>{
  try {
   const id = req.user.id;
   const currentUser = await UserTable.findOne({where:{ id }})
    const alsoSeller = await SellersTable.findOne({where:{userId:id}})
    const username = currentUser.username
   const profilePicture = currentUser.profilePicture
   const coverPicture = currentUser.coverPicture
   const email = currentUser.email
   const role = currentUser.accountType
    let verificationStatus = alsoSeller ? alsoSeller.verificationStatus : null;
   
    


     if(role === "buyer" && currentUser){
       // For buyers and pending sellers, we return basic profile information
     return res.status(200).json({profileInfo:{username , profilePicture , coverPicture , email , role}})
     }else if(role === "pending-seller"){
       // For pending sellers, we return basic profile information
       return res.status(200).json({profileInfo:{username , profilePicture , coverPicture , email , role , verificationStatus}})
     }else if(role ==="seller" && alsoSeller){
       const businessName = alsoSeller.businessName;
       const businessAddress = alsoSeller.businessAddress;
       const category = alsoSeller.category;
       const country = alsoSeller.country;
       const state = alsoSeller.state;
       const rating = alsoSeller.rating;
       const totalSales = alsoSeller.totalSales;
       verificationStatus = alsoSeller.verificationStatus;
       // For sellers, we return additional business information
       
         return res.status(200).json({profileInfo:{username , profilePicture , coverPicture , email , role , businessName , businessAddress , category , country , state, rating, totalSales, verificationStatus}}) 
        
   }
} catch (error) {
       return res.status(500).json({message:"Error fetching user profile", error:error.message})
    
   }

}

module.exports = currentUserprofile