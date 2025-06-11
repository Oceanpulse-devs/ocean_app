const { where } = require('sequelize');
const {UserTable} = require('../../models')

const currentUserprofile = async(req,res)=>{
  try {
   const id = req.user.id;
   const currentUser = await UserTable.findOne({where:{ id }})
    const username = currentUser.username
   const profilePicture = currentUser.profilePicture
   const coverPicture = currentUser.coverPicture
   const email = currentUser.email
   const role = currentUser.accountType


     if(role === "buyer"){
     return res.status(200).json({profileInfo:{username , profilePicture , coverPicture , email , role}})
     }
   } catch (error) {
       return res.status(500).json({message:"Error fetching user profile", error:error.message})
    
   }
   



   
}

module.exports = currentUserprofile