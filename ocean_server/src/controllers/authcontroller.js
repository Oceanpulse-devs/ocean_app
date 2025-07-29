const {UserTable,SellersTable, SellerDocument} = require('../../models')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { where } = require('sequelize')
const JWT_SECRET = process.env.JWT_SECRET
const redisClient = require('../config/redisdb')

// Account lockout configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds


// Input validation helper functions
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phoneNumber);
};

const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

//signing up
const signup = async(req, res) => {
   const {fullName, email, password, confirmPassword, agreeTerms, state, country, phoneNumber, address} = req.body;

   try{
    // Input validation
    if(!fullName || !email || !password || !confirmPassword){
        return res.status(400).json({message:"All required fields must be provided"})
    }

    if(fullName.trim().length < 2){
        return res.status(400).json({message:"Full name must be at least 2 characters long"})
    }

    if(!validateEmail(email)){
        return res.status(400).json({message:"Please provide a valid email address"})
    }

    if(!validatePassword(password)){
        return res.status(400).json({message:"Password must be at least 8 characters with uppercase, lowercase, and number"})
    }

    if(password !== confirmPassword){
        return res.status(400).json({message:"Password and confirm password do not match"})
    }

    if(phoneNumber && !validatePhoneNumber(phoneNumber)){
        return res.status(400).json({message:"Please provide a valid phone number"})
    }

    if(!agreeTerms){
        return res.status(400).json({message:"You must agree to the terms and conditions"})
    }

    //checking if user already exist
    const existingUser = await UserTable.findOne({where:{ email }})
    if(existingUser){
        return res.status(400).json({message:"User already exists with this email"})
    }

    //hashing the password
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await UserTable.create({
        fullName: fullName.trim(),
        username: fullName.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        agreeTerms,
        state: state?.trim(),
        country: country?.trim(),
        phoneNumber: phoneNumber?.trim(),
        address: address?.trim()
    })

    res.status(201).json({
        message:"User created successfully",
        user: {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            accountType: newUser.accountType,
            accountStatus: newUser.accountStatus
        }
    })
   }catch(error){
        res.status(500).json({message:"Error creating user", error:error.message})
   }
};

// login or signing in
const login = async(req,res)=>{
   const {email, password} = req.body;

   try{
    // Input validation
    if(!email || !password){
        return res.status(400).json({message:"Email and password are required"})
    }

    if(!validateEmail(email)){
        return res.status(400).json({message:"Please provide a valid email address"})
    }

    //checking if email is already existing
    const existingUser = await UserTable.findOne({where:{ email: email.toLowerCase().trim() }})
    if(!existingUser){
        return res.status(400).json({message:"Invalid email or password."})
    }

    //checking if account is active
    if(existingUser.accountStatus !== 'active'){
        return res.status(403).json({message:"Account is not active. Please contact support."})
    }

    // Check for account lockout
    const lockoutKey = `lockout:${existingUser.id}`;
    const lockoutData = await redisClient.get(lockoutKey);

    if(lockoutData) {
        const lockoutInfo = JSON.parse(lockoutData);
        const timeElapsed = Date.now() - lockoutInfo.timestamp;
        const remainingTime = Math.ceil((LOCKOUT_DURATION * 1000 - timeElapsed) / 1000 / 60);

        if(lockoutInfo.attempts >= MAX_LOGIN_ATTEMPTS && timeElapsed < LOCKOUT_DURATION * 1000) {
            return res.status(429).json({
                message: `Account temporarily locked. Try again in ${remainingTime} minutes.`
            });
        } else if(timeElapsed >= LOCKOUT_DURATION * 1000) {
            // Reset lockout after duration expires
            await redisClient.del(lockoutKey);
        }
    }

    //checking if password matches
    const passwordMatched = await bcrypt.compare(password, existingUser.password)
    if(!passwordMatched){
        // Increment failed attempts
        const currentAttempts = lockoutData ? JSON.parse(lockoutData).attempts : 0;
        const newAttempts = currentAttempts + 1;

        if(newAttempts >= MAX_LOGIN_ATTEMPTS) {
            await redisClient.set(lockoutKey, JSON.stringify({
                attempts: newAttempts,
                timestamp: Date.now()
            }), {EX: LOCKOUT_DURATION});

            return res.status(429).json({
                message: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION / 60} minutes.`
            });
        } else {
            await redisClient.set(lockoutKey, JSON.stringify({
                attempts: newAttempts,
                timestamp: Date.now()
            }), {EX: LOCKOUT_DURATION});

            return res.status(400).json({
                message: `Invalid email or password. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`
            });
        }
    }

    // Successful login - clear lockout data
    await redisClient.del(lockoutKey);

    // Generate unique session ID for this login
    const sessionId = require('crypto').randomBytes(32).toString('hex');

    //generating jwt token with session ID
    const token = jwt.sign(
        {
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.accountType,
            sessionId: sessionId
        },
        JWT_SECRET,
        {expiresIn: '7d'}
    );

    // Store session in Redis for logout from all devices functionality
    await redisClient.set(`session:${existingUser.id}:${sessionId}`, 'active', {EX: 7 * 24 * 60 * 60});

    //send token in http-only cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 //7days
    });

    res.status(200).json({
        message:"User successfully signed in.",
        user:{
            id: existingUser.id,
            fullName: existingUser.fullName,
            email: existingUser.email,
            role: existingUser.accountType
        }
    })
   }catch(error){
    res.status(500).json({message:"Error signing user in", error:error.message})
   }
};

//forgot password
const forgotPassword = async(req,res)=>{
    const {email} = req.body;

    if(!email){
       return res.status(400).json({message:"Email is required."})
    }

    if(!validateEmail(email)){
        return res.status(400).json({message:"Please provide a valid email address"})
    }

    try{
     const userEmail = await UserTable.findOne({where: {email: email.toLowerCase().trim()}})
     if(!userEmail){
        return res.status(404).json({message:"No user found with this email."})
     }

     // Check if account is active
     if(userEmail.accountStatus !== 'active'){
        return res.status(403).json({message:"Account is not active. Please contact support."})
     }

     //generating reset code
     const resetcode = Math.floor(10000 + Math.random() * 90000)//5 digits
     //store in redis
     await redisClient.set(`reset:${email.toLowerCase().trim()}`, resetcode, {EX: 600})
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
    const {email, resetCode} = req.body;

    if(!email || !resetCode){
        return res.status(400).json({message:"Email and reset code are required."})
    }

    if(!validateEmail(email)){
        return res.status(400).json({message:"Please provide a valid email address"})
    }

    if(!resetCode.toString().match(/^\d{5}$/)){
        return res.status(400).json({message:"Reset code must be 5 digits."})
    }

    try {
        const storedCode = await redisClient.get(`reset:${email.toLowerCase().trim()}`);

        if (!storedCode) {
          return res.status(400).json({ message: 'Reset code has expired.'});
        }

        if (storedCode !== resetCode) {
          return res.status(400).json({ message: 'Invalid reset code.'});
        }

        res.status(200).json({ message: 'Reset code verified successfully.' });
      } catch (error) {
        res.status(500).json({ message: 'Error verifying code', error: error.message});
      }
};

const resetPassword = async(req,res)=>{
    const {email, resetCode, newPassword, confirmNewPassword} = req.body;

    if(!email || !resetCode || !newPassword || !confirmNewPassword){
        return res.status(400).json({message:"All fields are required."})
    }

    if(!validateEmail(email)){
        return res.status(400).json({message:"Please provide a valid email address"})
    }

    if(!resetCode.toString().match(/^\d{5}$/)){
        return res.status(400).json({message:"Reset code must be 5 digits."})
    }

    if(!validatePassword(newPassword)){
        return res.status(400).json({message:"Password must be at least 8 characters with uppercase, lowercase, and number"})
    }

    if(newPassword !== confirmNewPassword){
        return res.status(400).json({message:"New password and confirm password do not match."})
    }

    try {
        // Verify the reset code
        const storedCode = await redisClient.get(`reset:${email.toLowerCase().trim()}`);

        if (!storedCode) {
            return res.status(400).json({ message: 'Reset code has expired.'});
        }

        if (storedCode !== resetCode) {
            return res.status(400).json({ message: 'Invalid reset code.'});
        }

        // Find the user
        const user = await UserTable.findOne({where: {email: email.toLowerCase().trim()}});
        if(!user){
            return res.status(404).json({message:"User not found."})
        }

        // Check if account is active
        if(user.accountStatus !== 'active'){
            return res.status(403).json({message:"Account is not active. Please contact support."})
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password
        await UserTable.update(
            { password: hashedPassword },
            { where: { email: email.toLowerCase().trim() } }
        );

        // Delete the reset code from Redis
        await redisClient.del(`reset:${email.toLowerCase().trim()}`);

        res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message});
    }
};

// Business category validation
const validateBusinessCategory = (category) => {
    const validCategories = [
        'electronics', 'fashion', 'home', 'sports', 'books', 'automotive',
        'health', 'beauty', 'food', 'jewelry', 'art', 'music', 'toys',
        'garden', 'office', 'baby', 'pet', 'other'
    ];
    return validCategories.includes(category.toLowerCase());
};

// Document type validation
const validateDocumentType = (documentType) => {
    const validDocumentTypes = ['NIN', 'DriversLicense', 'Passport', 'BusinessCertificate', 'BusinessLicense'];
    return validDocumentTypes.includes(documentType);
};

// Image URL validation (basic)
const validateImageUrl = (imageUrl) => {
    const imageRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    return imageRegex.test(imageUrl) || imageUrl.startsWith('data:image/');
};

const sellerRegistration = async(req,res)=>{
    const {businessName, businessAddress, category, documentType, documentNumber, documentImage} = req.body;

    try {
        // Input validation
        if(!businessName || !businessAddress || !category || !documentType || !documentImage){
            return res.status(400).json({message:"All required fields must be provided"})
        }

        if(businessName.trim().length < 2){
            return res.status(400).json({message:"Business name must be at least 2 characters long"})
        }

        if(businessAddress.trim().length < 10){
            return res.status(400).json({message:"Business address must be at least 10 characters long"})
        }

        if(!validateBusinessCategory(category)){
            return res.status(400).json({message:"Invalid business category"})
        }

        if(!validateDocumentType(documentType)){
            return res.status(400).json({message:"Invalid document type"})
        }

        if(documentNumber && documentNumber.trim().length < 3){
            return res.status(400).json({message:"Document number must be at least 3 characters long"})
        }

        if(!validateImageUrl(documentImage)){
            return res.status(400).json({message:"Invalid image format. Please upload a valid image file"})
        }

        const currentUserId = req.user.id;

        // Check if user already has a seller account
        const existingSeller = await SellersTable.findOne({where: {userId: currentUserId}});
        if(existingSeller){
            if(existingSeller.verificationStatus === 'approved'){
                return res.status(400).json({message:"You are already an approved seller."})
            }else if(existingSeller.verificationStatus === 'pending'){
                return res.status(400).json({message:"Your seller application is currently under review."})
            }else if(existingSeller.verificationStatus === 'rejected'){
                return res.status(400).json({message:"Your previous seller application was rejected. Please contact support for appeal."})
            }
        }

        // Check if business name is already taken
        const existingBusiness = await SellersTable.findOne({where: {businessName: businessName.trim()}});
        if(existingBusiness){
            return res.status(400).json({message:"Business name is already registered. Please choose a different name."})
        }

        const currentuser = await UserTable.findOne({where: {id: currentUserId}});

        // Create seller record
        const newSeller = await SellersTable.create({
            userId: currentUserId,
            fullName: currentuser.fullName,
            businessName: businessName.trim(),
            email: currentuser.email,
            phoneNumber: currentuser.phoneNumber,
            businessAddress: businessAddress.trim(),
            country: currentuser.country,
            state: currentuser.state,
            category: category.toLowerCase(),
            verificationStatus: 'pending'
        });

        // Create seller document record
        await SellerDocument.create({
            sellerId: newSeller.id,
            documentType,
            documentNumber: documentNumber?.trim(),
            documentImage,
            status: 'pending'
        });

        // Update user account type to pending-seller
        await UserTable.update(
            { accountType: 'pending-seller' },
            { where: { id: currentUserId } }
        );

        res.status(201).json({
            message: "Seller registration submitted successfully. Your application is under review.",
            seller: {
                id: newSeller.id,
                businessName: newSeller.businessName,
                category: newSeller.category,
                verificationStatus: newSeller.verificationStatus
            }
        });
    } catch (error) {
        res.status(500).json({message:"Seller registration failed.", error: error.message})
    }
}

// Admin functions for seller management
const approveSeller = async(req,res)=>{
    const {sellerId, adminNotes} = req.body;

    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        if(!sellerId){
            return res.status(400).json({message:"Seller ID is required"})
        }

        const seller = await SellersTable.findOne({where: {id: sellerId}});
        if(!seller){
            return res.status(404).json({message:"Seller not found"})
        }

        if(seller.verificationStatus === 'approved'){
            return res.status(400).json({message:"Seller is already approved"})
        }

        // Update seller verification status
        await SellersTable.update({
            verificationStatus: 'approved',
            verifiedAt: new Date(),
            isVerified: true
        }, {where: {id: sellerId}});

        // Update seller document status
        await SellerDocument.update({
            status: 'approved',
            verifiedAt: new Date()
        }, {where: {sellerId: sellerId}});

        // Update user account type
        await UserTable.update({
            accountType: 'seller'
        }, {where: {id: seller.userId}});

        res.status(200).json({
            message: "Seller approved successfully",
            sellerId: sellerId
        });
    } catch (error) {
        res.status(500).json({message:"Error approving seller", error: error.message})
    }
};

const rejectSeller = async(req,res)=>{
    const {sellerId, rejectionReason, adminNotes} = req.body;

    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        if(!sellerId || !rejectionReason){
            return res.status(400).json({message:"Seller ID and rejection reason are required"})
        }

        const seller = await SellersTable.findOne({where: {id: sellerId}});
        if(!seller){
            return res.status(404).json({message:"Seller not found"})
        }

        if(seller.verificationStatus === 'rejected'){
            return res.status(400).json({message:"Seller is already rejected"})
        }

        // Update seller verification status
        await SellersTable.update({
            verificationStatus: 'rejected',
            verifiedAt: new Date()
        }, {where: {id: sellerId}});

        // Update seller document status
        await SellerDocument.update({
            status: 'rejected',
            verifiedAt: new Date()
        }, {where: {sellerId: sellerId}});

        // Update user account type back to buyer
        await UserTable.update({
            accountType: 'buyer'
        }, {where: {id: seller.userId}});

        res.status(200).json({
            message: "Seller rejected successfully",
            sellerId: sellerId,
            rejectionReason: rejectionReason
        });
    } catch (error) {
        res.status(500).json({message:"Error rejecting seller", error: error.message})
    }
};

const getPendingSellers = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const pendingSellers = await SellersTable.findAll({
            where: {verificationStatus: 'pending'},
            include: [{
                model: SellerDocument,
                as: 'documents',
                attributes: ['documentType', 'documentNumber', 'documentImage', 'status', 'submittedAt']
            }],
            order: [['createdAt', 'ASC']]
        });

        res.status(200).json({
            message: "Pending sellers retrieved successfully",
            sellers: pendingSellers
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving pending sellers", error: error.message})
    }
};

// Get all sellers (admin only)
const getAllSellers = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { status, category, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        if(status) whereClause.verificationStatus = status;
        if(category) whereClause.category = category;

        const sellers = await SellersTable.findAndCountAll({
            where: whereClause,
            include: [{
                model: SellerDocument,
                as: 'documents',
                attributes: ['documentType', 'documentNumber', 'status', 'submittedAt']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.status(200).json({
            message: "Sellers retrieved successfully",
            sellers: sellers.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(sellers.count / limit),
                totalSellers: sellers.count,
                sellersPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving sellers", error: error.message})
    }
};

// Get seller details by ID (admin only)
const getSellerById = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { sellerId } = req.params;

        const seller = await SellersTable.findOne({
            where: { id: sellerId },
            include: [{
                model: SellerDocument,
                as: 'documents',
                attributes: ['documentType', 'documentNumber', 'documentImage', 'status', 'submittedAt', 'verifiedAt']
            }]
        });

        if(!seller){
            return res.status(404).json({message:"Seller not found"})
        }

        res.status(200).json({
            message: "Seller details retrieved successfully",
            seller: seller
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving seller details", error: error.message})
    }
};

// Suspend/Activate seller (admin only)
const toggleSellerStatus = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { sellerId, action, reason } = req.body;

        if(!sellerId || !action){
            return res.status(400).json({message:"Seller ID and action are required"})
        }

        if(!['suspend', 'activate'].includes(action)){
            return res.status(400).json({message:"Action must be 'suspend' or 'activate'"})
        }

        const seller = await SellersTable.findOne({where: {id: sellerId}});
        if(!seller){
            return res.status(404).json({message:"Seller not found"})
        }

        const newStatus = action === 'suspend' ? 'suspended' : 'active';
        
        // Update seller status
        await SellersTable.update({
            verificationStatus: newStatus,
            verifiedAt: new Date()
        }, {where: {id: sellerId}});

        // Update user account status
        const userStatus = action === 'suspend' ? 'suspended' : 'active';
        await UserTable.update({
            accountStatus: userStatus
        }, {where: {id: seller.userId}});

        res.status(200).json({
            message: `Seller ${action}d successfully`,
            sellerId: sellerId,
            action: action,
            reason: reason
        });
    } catch (error) {
        res.status(500).json({message:"Error updating seller status", error: error.message})
    }
};

// Get admin dashboard stats
const getAdminStats = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const [
            totalSellers,
            pendingSellers,
            approvedSellers,
            rejectedSellers,
            totalUsers
        ] = await Promise.all([
            SellersTable.count(),
            SellersTable.count({where: {verificationStatus: 'pending'}}),
            SellersTable.count({where: {verificationStatus: 'approved'}}),
            SellersTable.count({where: {verificationStatus: 'rejected'}}),
            UserTable.count()
        ]);

        res.status(200).json({
            message: "Admin stats retrieved successfully",
            stats: {
                totalSellers,
                pendingSellers,
                approvedSellers,
                rejectedSellers,
                totalUsers,
                approvalRate: totalSellers > 0 ? ((approvedSellers / totalSellers) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving admin stats", error: error.message})
    }
};



module.exports = {signup,login,forgotPassword,verifyResetCode,resetPassword,sellerRegistration,approveSeller,rejectSeller,getPendingSellers,getAllSellers,getSellerById,toggleSellerStatus,getAdminStats};