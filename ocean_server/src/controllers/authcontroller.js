const {UserTable} = require('../../models')
const bcrypt = require('bcrypt')

const signup =   async(req , res)=>{
   const {fullName, email , password , confirmPassword} = req.body;

   try{
    if(password !== confirmPassword){
        return res.status(400).json({message:"password and confirm password do not match"})
    }
    if(password.length < 8 ){
        return res.status(400).json({message:"Password must not be less than 8 characters"})
    }
   const existingUser = await UserTable.findOne({where:{ email }})
   if(existingUser){
    return res.status(400).json({message:"user already exists"})
   }
   const hashedPassword = await bcrypt.hash(password,10)
   const newUser = await UserTable.create({fullName,username:fullName, email, password:hashedPassword})
   res.status(201).json({message:"user created successfully", user:newUser})
}catch(error){
    res.status(500).json({message:"error creating user", error:error.message})
}
}


const login = async(req,res)=>{
   const {email , password} = req.body;

   try{
    const existingUser = await UserTable.findOne({where:{ email }})
    // console.log(existingUser)
    if(!existingUser){
        res.status(400).json({messsage:`Wrong Email or password, or user with ${email} does not exist.`})
    }
    
    const passwordMatched = await bcrypt.compare(password,UserTable.password)
    if(!passwordMatched){
        res.status(400).json({messsage:`Wrong Email or password, or user with ${email} does not exist.`})
    }

   }catch(error){
    res.status(500).json({message:"error Signing user in",error:error.message})
   }
}

module.exports = {signup,login};