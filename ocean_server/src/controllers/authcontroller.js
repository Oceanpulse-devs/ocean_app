const {UserTable} = require('../../models')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET


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
}

module.exports = {signup,login};