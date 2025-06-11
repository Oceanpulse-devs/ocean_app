const {UserTable,SellersTable, SellerDocument} = require('../../models')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { where } = require('sequelize')
const JWT_SECRET = process.env.JWT_SECRET
const redisClient = require('../config/redisdb')


//signing up
const signup =   async(req , res)=>{
   const {fullName, email , password , confirmPassword, state , country , phoneNumber , address} = req.body;

   try{
    //makign sure two passwords match
    if(password !== confirmPassword){
        return res.status(400).json({message:"password and confirm password do not match"})
    }
    if(password.length < 8 ){
        return res.status(400).json({message:"Password must not be less than 8 characters"})
    }
    //checking if user already exist
   const existingUser = await UserTable.findOne({where:{ email }})
   if(existingUser){
    return res.status(400).json({message:"user already exists"})
   }
   //hashing the password
   const hashedPassword = await bcrypt.hash(password,10)
   const newUser = await UserTable.create({fullName , username:fullName , email, password:hashedPassword, state , country , phoneNumber , address})
   res.status(201).json({message:"user created successfully", user:newUser})
}catch(error){
    res.status(500).json({message:"error creating user", error:error.message})
}
};

// login or signing in
const login = async(req,res)=>{
   const {email , password} = req.body;

   try{
    //checking if email is already existing 
    const existingUser = await UserTable.findOne({where:{ email }})
    if(!existingUser){
        res.status(400).json({messsage:`invalid Email or password.`})
    }
    //checking if password matches
    const passwordMatched = await bcrypt.compare(password,existingUser.password)
    if(!passwordMatched){
        res.status(400).json({messsage:`invalid Email or password.`})
    }
    //generating jwt token
    const token = jwt.sign(
        {id: existingUser.id , email: existingUser.email , role: existingUser.accountType},JWT_SECRET,
        {expiresIn: '7d'}
    );
    //send token in http-only cookie
    res.cookie('token',token,{
        httpOnly: true,
        secure: process.env.NODE_ENV, //=== 'production' , during development,
        maxAge: 7 *24 *60 *60 *1000 //7days
    });
    res.status(200).json({message:"User successfully signed in.",user:{
        id:existingUser.id,
        fullName:existingUser.fullName,
        email:existingUser.email,
        role: existingUser.accountType
    }})
   }catch(error){
    res.status(500).json({message:"error Signing user in",error:error.message})
   }
};

//forgot password
const forgotPassword = async(req,res)=>{
    const {email} = req.body;

    if(!email){
       return res.status(400).json({message:"Email  is required."})
    }
    try{
     const userEmail = await UserTable.findOne({where: {email}})
     if(!userEmail){
        return res.status(404).json({message:"No user found with this email."})
     }
     //generating reset code
     const resetcode = Math.floor(10000 + Math.random() * 90000)//5 digits
     //store in reddis
     await redisClient.set(`reset:${email}`, resetcode,{EX: 600})
     console.log("saved reset to redis.")
     //sending reset code to users gmail
     console.log(`Reset code for ${email} is ${resetcode}. please do not share this with anyone.`)

     res.json({ message: 'Reset code generated and logged (for dev use).' });

    }catch(error){
        res.status(500).json({ message: 'Error generating reset code', error: error.message });
    }
};

//verify reset code
const verifyResetCode = async(req,res)=>{
    const {email , resetCode}= req.body;

    if(!email || !resetCode){
        return res.status(400).json({message:"Invalid or expired reset code."})
    }
    try {
        const storedCode = await redisClient.get(`reset:${email}`);
    
        if (storedCode !== resetCode) {
          return res.status(400).json({ message: 'Invalid or expired reset code.'});
        }
    
        res.status(200).json({ message: 'Reset code verified successfully.' });
      } catch (error) {
        res.status(500).json({ message: 'Error verifying code', error: error.message});
      }
};

const sellerRegistration = async(req,res)=>{
    const {businessName , businessAddress ,  category , documentType , documentNumber , documentImage} = req.body;
    try {
        const currentUserId = req.user.id
        if(currentUserId){
            const existingSeller = await SellersTable.findOne({where :{userId:currentUserId}})
            if(existingSeller){
                return res.status(400).json({message:"You are already a Seller. Do you want to upgrade your plan?."})
            }
        }
        const currentuser = await UserTable.findOne({where:{id:currentUserId}})
        const newSeller = await SellersTable.create({
            userId: currentUserId,
            fullName: currentuser.fullName,
            businessName,
            email: currentuser.email,
            phoneNumber: currentuser.phoneNumber,
            businessAddress,
            country: currentuser.country,
            state: currentuser.state,
            category
        });
        // Create seller documents
        await SellerDocument.create({
            sellerId: newSeller.id,
            documentType,
            documentNumber,
            documentImage
        });
        res.status(201).json({message:"Seller registered successfully.", seller:newSeller});
    } catch (error) {
        res.status(500).json({message:"Seller's registration failed.",error:error.message})
    }
}

module.exports = {signup,login,forgotPassword,verifyResetCode,sellerRegistration};