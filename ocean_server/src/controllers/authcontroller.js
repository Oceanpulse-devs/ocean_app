const db = require('../../models')
const {UserTable, SellersTable, SellerDocument, Product, Post, Auction, GroupBuy, SwapDeal, BuyerNeed, UserFollows, SavedItem, PostLike, ProductLike, Notification} = db
const { sendSellerApplicationNotification, sendAdminNotification } = require('./notificationController')
const { sendEmail, emailTemplates } = require('../services/emailService')
const CloudinaryService = require('../services/cloudinaryService')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { Op } = require('sequelize')
const JWT_SECRET = process.env.JWT_SECRET
const redisClient = require('../config/redisdb')
const { mapRequestFields, mapResponseFields } = require('../../utils/fieldMapper')
const axios = require('axios')

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
   const {fullName, email, password, confirmPassword, agreeTerms} = req.body;

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
    
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    // Generate unique username
    const generateUsername = async (fullName) => {
        const baseName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
        const randomSuffix = crypto.randomBytes(4).toString('hex');
        let username = `@${baseName}_${randomSuffix}`;
        
        // Ensure username is unique
        let counter = 1;
        while (await UserTable.findOne({ where: { username } })) {
            username = `@${baseName}_${randomSuffix}${counter}`;
            counter++;
        }
        
        return username;
    };

    const username = await generateUsername(fullName);

    const newUser = await UserTable.create({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        username: username,
        password: hashedPassword,
        agreeTerms,
        accountType: 'buyer', // Default to buyer
        accountStatus: 'pending', // Pending until email verification
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires
    })

    // Cache verification token in Redis for faster verification
    try {
        const redisKey = `email_verification:${emailVerificationToken}`;
        await redisClient.setEx(redisKey, 86400, JSON.stringify({ // 24 hours
            userId: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            createdAt: new Date().toISOString()
        }));
        console.log('✅ Verification token cached in Redis:', redisKey);
    } catch (redisError) {
        console.error('❌ Redis caching failed (continuing without cache):', redisError.message);
        // Continue without Redis caching - the system will still work
    }

    // Send verification email
    const backendUrl = process.env.NODE_ENV === 'production' 
        ? process.env.RAILWAY_PUBLIC_DOMAIN || process.env.BACKEND_URL || 'https://your-backend-domain.com'
        : 'http://localhost:5000';
    const verificationLink = `${backendUrl}/verify-email?token=${emailVerificationToken}`
    const emailTemplate = emailTemplates.emailVerification(newUser.fullName, verificationLink)
    
    try {
        await sendEmail(newUser.email, emailTemplate.subject, emailTemplate.html, 'verification')
        console.log('✅ Verification email sent to:', newUser.email)
    } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError)
        // Don't fail the signup if email fails, but log the error
    }

    res.status(201).json({
        message:"User created successfully. Please check your email to verify your account.",
        user: {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.accountType, // Current role for permissions
            accountType: newUser.accountType, // Account classification
            accountStatus: newUser.accountStatus,
            emailVerified: newUser.emailVerified
        },
        requiresVerification: true
    })
}catch(error){
        console.error('Signup error:', error);
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
        if(existingUser.accountStatus === 'suspended'){
            return res.status(403).json({message:"Your account has been suspended. Please contact support for assistance."})
        }
        if(existingUser.accountStatus === 'pending'){
            return res.status(403).json({
                message:"Please verify your email address before logging in. Check your email for a verification link.",
                requiresVerification: true,
                email: existingUser.email
            })
        }
        return res.status(403).json({message:"Account is not active. Please contact support."})
    }

    //checking if email is verified
    if(!existingUser.emailVerified){
        return res.status(403).json({
            message:"Please verify your email address before logging in. Check your email for a verification link.",
            requiresVerification: true,
            email: existingUser.email
        })
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
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 //7days
    });

    // Build user object with all fields frontend expects
    const userResponse = {
        id: existingUser.id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        role: existingUser.accountType, // Current role for permissions
        accountType: existingUser.accountType, // Account classification
        accountStatus: existingUser.accountStatus,
        profilePicture: existingUser.profilePicture || null,
        username: existingUser.username || null,
        bio: existingUser.bio || null,
        location: existingUser.location || null,
        emailVerified: existingUser.emailVerified || false
    };

    res.status(200).json({
        message:"User successfully signed in.",
        user: userResponse,
        token: token // Include token in response for Flutter Web
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
     
     //sending reset code via email
     try {
         const emailTemplate = emailTemplates.passwordReset(userEmail.fullName, resetcode);
         await sendEmail(email, emailTemplate.subject, emailTemplate.html, 'password-reset');
         console.log(`✅ Password reset code sent to: ${email}`);
     } catch (emailError) {
         console.error('❌ Failed to send password reset email:', emailError);
         // Don't fail the request if email fails, but log the error
     }

     res.json({ message: 'Reset code sent to your email address.' });

    }catch(error){
        res.status(500).json({ message: 'Error generating reset code', error: error.message });
    }
};

//verify reset code
const verifyResetCode = async(req,res)=>{
    // Accept both 'otp' and 'resetCode' field names for frontend compatibility
    const {email, resetCode: resetCodeFromBody, otp} = req.body;
    
    // Use whichever field is provided
    const resetCode = resetCodeFromBody || otp;

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

// Business category validation - Updated for Universal Category System
const validateBusinessCategory = async (category) => {
    try {
        // Import ProductCategory model
        const { ProductCategory } = require('../models');
        
        // Check if category exists in the universal category system
        // Support both UUID and name lookup
        let categoryRecord;
        if (category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // UUID format
            categoryRecord = await ProductCategory.findByPk(category);
        } else {
            // Name format
            categoryRecord = await ProductCategory.findOne({ 
                where: { 
                    name: category,
                    isActive: true 
                } 
            });
        }
        
        return !!categoryRecord; // Return true if category exists
    } catch (error) {
        console.error('Error validating business category:', error);
        return false;
    }
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
    const {
        businessName, 
        businessAddress, 
        businessDescription,
        sellerTypes, // Array of seller types (retailer, wholesaler, etc.)
        selectedCategories, // Array of main categories
        selectedSubcategories, // Object mapping categories to subcategories
        businessEmail,
        businessPhone,
        country,
        documentType, 
        documentNumber, 
        personalIdType,
        personalIdNumber
    } = req.body;

    // Handle file uploads from multipart/form-data
    const businessDocumentFile = req.files?.businessDocument;
    const personalIdFile = req.files?.personalId;

    // Parse JSON fields from multipart/form-data
    let parsedSellerTypes = sellerTypes;
    let parsedSelectedCategories = selectedCategories;
    let parsedSelectedSubcategories = selectedSubcategories;

    // Debug logging
    console.log('🔍 SELLER REGISTRATION DEBUG:');
    console.log('   Business Name:', businessName);
    console.log('   Business Address:', businessAddress);
    console.log('   Business Description:', businessDescription);
    console.log('   Country:', country);
    console.log('   Raw sellerTypes:', sellerTypes, 'Type:', typeof sellerTypes);
    console.log('   Raw selectedCategories:', selectedCategories, 'Type:', typeof selectedCategories);

    // Parse sellerTypes if it's a JSON string
    if (typeof sellerTypes === 'string') {
        try {
            parsedSellerTypes = JSON.parse(sellerTypes);
        } catch (error) {
            return res.status(400).json({message:"Invalid sellerTypes format. Must be a valid JSON array."})
        }
    }

    // Parse selectedCategories if it's a JSON string
    if (typeof selectedCategories === 'string') {
        try {
            parsedSelectedCategories = JSON.parse(selectedCategories);
        } catch (error) {
            return res.status(400).json({message:"Invalid selectedCategories format. Must be a valid JSON array."})
        }
    }

    // Parse selectedSubcategories if it's a JSON string
    if (typeof selectedSubcategories === 'string') {
        try {
            parsedSelectedSubcategories = JSON.parse(selectedSubcategories);
        } catch (error) {
            return res.status(400).json({message:"Invalid selectedSubcategories format. Must be a valid JSON object."})
        }
    }

    try {
        // Input validation
        if(!businessName || !businessAddress || !businessDescription || !parsedSellerTypes || !parsedSelectedCategories || !country || !documentType || !businessDocumentFile){
            return res.status(400).json({message:"All required fields must be provided"})
        }

        if(businessName.trim().length < 2){
            return res.status(400).json({message:"Business name must be at least 2 characters long"})
        }

        if(businessAddress.trim().length < 10){
            return res.status(400).json({message:"Business address must be at least 10 characters long"})
        }

        if(businessDescription.trim().length < 10){
            return res.status(400).json({message:"Business description must be at least 10 characters long"})
        }

        // Validate seller types
        const validSellerTypes = ['retailer', 'wholesaler', 'distributor', 'manufacturer'];
        if(!Array.isArray(parsedSellerTypes) || parsedSellerTypes.length === 0){
            return res.status(400).json({message:"Please select at least one seller type. You can select multiple types if applicable to your business."})
        }
        for(const type of parsedSellerTypes){
            if(!validSellerTypes.includes(type)){
                return res.status(400).json({message:`Invalid seller type: ${type}`})
            }
        }

        // Validate selected categories
        if(!Array.isArray(parsedSelectedCategories) || parsedSelectedCategories.length === 0 || parsedSelectedCategories.length > 5){
            return res.status(400).json({message:"You must select 1-5 main categories"})
        }

        // Validate business email if provided
        if(businessEmail && !businessEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)){
            return res.status(400).json({message:"Invalid business email format"})
        }

        // Validate business phone if provided
        if(businessPhone && businessPhone.trim().length < 10){
            return res.status(400).json({message:"Business phone number must be at least 10 characters long"})
        }

        if(!validateDocumentType(documentType)){
            return res.status(400).json({message:"Invalid document type"})
        }

        if(documentNumber && documentNumber.trim().length < 3){
            return res.status(400).json({message:"Document number must be at least 3 characters long"})
        }

        // Validate business document file
        if(!businessDocumentFile || !businessDocumentFile[0]){
            return res.status(400).json({message:"Business document file is required"})
        }

        // Validate personal ID file if provided
        if(personalIdType && (!personalIdFile || !personalIdFile[0])){
            return res.status(400).json({message:"Personal ID file is required when personal ID type is provided"})
        }

        const currentUserId = req.user.id;

        // Debug logging for user info
        console.log('Current user info:', {
            userId: currentUserId,
            email: req.user.email,
            accountType: req.user.accountType,
            role: req.user.role
        });

        // Check if user already has a seller account
        const existingSeller = await SellersTable.findOne({where: {userId: currentUserId}});
            if(existingSeller){
                console.log('Existing seller found:', {
                    id: existingSeller.id,
                    userId: existingSeller.userId,
                    verificationStatus: existingSeller.verificationStatus,
                    businessName: existingSeller.businessName,
                    createdAt: existingSeller.createdAt
                });
                
                if(existingSeller.verificationStatus === 'approved'){
                return res.status(400).json({
                    message:"You are already an approved seller.",
                    sellerId: existingSeller.id,
                    businessName: existingSeller.businessName,
                    verificationStatus: existingSeller.verificationStatus
                })
            }else if(existingSeller.verificationStatus === 'pending'){
                return res.status(400).json({
                    message:"Your seller application is currently under review.",
                    sellerId: existingSeller.id,
                    businessName: existingSeller.businessName,
                    verificationStatus: existingSeller.verificationStatus,
                    submittedAt: existingSeller.createdAt
                })
            }else if(existingSeller.verificationStatus === 'rejected'){
                return res.status(400).json({
                    message:"Your previous seller application was rejected. Please contact support for appeal.",
                    sellerId: existingSeller.id,
                    businessName: existingSeller.businessName,
                    verificationStatus: existingSeller.verificationStatus,
                    rejectionReason: existingSeller.rejectionReason
                })
            } else {
                console.log('Unknown verification status:', existingSeller.verificationStatus);
                return res.status(400).json({
                    message:`Your seller account has an unknown status: ${existingSeller.verificationStatus}. Please contact support.`,
                    sellerId: existingSeller.id,
                    businessName: existingSeller.businessName,
                    verificationStatus: existingSeller.verificationStatus
                })
            }
        } else {
            console.log('No existing seller found for user:', currentUserId);
        }

        // Check if business name is already taken
        const existingBusiness = await SellersTable.findOne({where: {businessName: businessName.trim()}});
        if(existingBusiness){
            return res.status(400).json({message:"Business name is already registered. Please choose a different name."})
        }

        const currentuser = await UserTable.findOne({where: {id: currentUserId}});
        
        // Check if user exists
        if (!currentuser) {
            return res.status(404).json({message: "User not found. Please log in again."});
        }

        // Create seller record with all new fields
        console.log('💾 CREATING SELLER RECORD:');
        console.log('   User ID:', currentUserId);
        console.log('   Full Name:', currentuser.fullName);
        console.log('   Business Name:', businessName.trim());
        console.log('   Business Address:', businessAddress.trim());
        console.log('   Country:', country);
        
        const newSeller = await SellersTable.create({
            userId: currentUserId,
            fullName: currentuser.fullName,
            businessName: businessName.trim(),
            email: businessEmail || currentuser.email, // Use business email if provided
            phoneNumber: businessPhone || '', // Use business phone if provided, otherwise empty string
            businessAddress: businessAddress.trim(),
            country: country, // Use provided country
            state: '', // State not available in user table
            businessDescription: businessDescription.trim(),
            sellerType: parsedSellerTypes[0], // Use first seller type as primary (can be updated later)
            selectedCategories: parsedSelectedCategories, // Store as JSON array
            selectedSubcategories: parsedSelectedSubcategories || {}, // Store as JSON object
            businessEmail: businessEmail,
            businessPhone: businessPhone,
            verificationStatus: 'pending'
        });

        // Upload files to Cloudinary and create document records
        const documents = [];
        
        try {
            // Upload business document (from multipart/form-data buffer)
            const businessDocUpload = await CloudinaryService.uploadFile(
                businessDocumentFile[0].buffer,
                `seller-documents/${newSeller.id}/business-document`,
                { 
                    folder: 'seller-documents', 
                    resource_type: 'auto',
                    public_id: `business-doc-${newSeller.id}`
                }
            );
            
            documents.push({
                sellerId: newSeller.id,
                documentType,
                documentNumber: documentNumber?.trim(),
                documentImage: businessDocUpload.secure_url,
                status: 'pending'
            });
            
            // Upload personal ID document (if provided)
            if(personalIdType && personalIdFile && personalIdFile[0]){
                const personalIdUpload = await CloudinaryService.uploadFile(
                    personalIdFile[0].buffer,
                    `seller-documents/${newSeller.id}/personal-id`,
                    { 
                        folder: 'seller-documents', 
                        resource_type: 'auto',
                        public_id: `personal-id-${newSeller.id}`
                    }
                );
                
                documents.push({
                    sellerId: newSeller.id,
                    documentType: personalIdType,
                    documentNumber: personalIdNumber?.trim(),
                    documentImage: personalIdUpload.secure_url,
                    status: 'pending'
                });
            }
            
            // Create all documents
            await SellerDocument.bulkCreate(documents);
            
        } catch (uploadError) {
            console.error('File upload error:', uploadError);
            // If file upload fails, delete the seller record
            await SellersTable.destroy({ where: { id: newSeller.id } });
            return res.status(500).json({
                message: "File upload failed. Please try again.",
                error: uploadError.message
            });
        }

        // Update user account type to pending-seller
        await UserTable.update(
            { accountType: 'pending-seller' },
            { where: { id: currentUserId } }
        );

        // Send notification to user (in-app notification)
        await sendSellerApplicationNotification(currentUserId, 'submitted');

        // Send email to user confirming seller application submission
        try {
            const emailTemplate = emailTemplates.sellerApplicationSubmitted(currentuser.fullName || currentuser.username);
            await sendEmail(
                currentuser.email,
                emailTemplate.subject,
                emailTemplate.html,
                'seller-registration'
            );
            console.log('✅ Seller registration email sent to:', currentuser.email);
        } catch (emailError) {
            console.error('❌ Failed to send seller registration email:', emailError);
            // Don't fail registration if email fails
        }

        // Send notification to admins
        await sendAdminNotification(businessName);

        res.status(201).json({
            success: true,
            message: "Seller registration submitted successfully. Your application is under review.",
            data: {
                sellerId: newSeller.id,
                businessName: newSeller.businessName,
                businessDescription: newSeller.businessDescription,
                sellerType: newSeller.sellerType,
                selectedCategories: newSeller.selectedCategories,
                selectedSubcategories: newSeller.selectedSubcategories,
                businessEmail: newSeller.businessEmail,
                businessPhone: newSeller.businessPhone,
                verificationStatus: newSeller.verificationStatus,
                documentsSubmitted: documents.length,
                submittedAt: newSeller.createdAt,
                nextSteps: [
                    "Wait for admin review (5-7 business days)",
                    "Check verification status regularly",
                    "You will receive email notifications about status updates"
                ]
            }
        });
    } catch (error) {
        res.status(500).json({message:"Seller registration failed.", error: error.message})
    }
}





// Verify email address
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Verification token is required" });
        }

        // Check Redis cache first for faster verification
        let user;
        const redisKey = `email_verification:${token}`;
        try {
            const cachedUserData = await redisClient.get(redisKey);
            
            if (cachedUserData) {
                // Token found in Redis cache
                const userData = JSON.parse(cachedUserData);
                user = await UserTable.findByPk(userData.userId);
                console.log('✅ Email verification token found in Redis cache');
            }
        } catch (redisError) {
            console.error('❌ Redis lookup failed (falling back to database):', redisError.message);
        }
        
        // Fallback to database lookup if Redis failed or no cache found
        if (!user) {
            user = await UserTable.findOne({
                where: {
                    emailVerificationToken: token,
                    emailVerificationExpires: {
                        [Op.gt]: new Date() // Token not expired
                    }
                }
            });
        }

        if (!user) {
            return res.status(400).json({ 
                message: "Invalid or expired verification token" 
            });
        }

        // Check if already verified (prevent double verification)
        if (user.emailVerified) {
            return res.status(400).json({ 
                message: "Email is already verified" 
            });
        }

        // Update user status
        await user.update({
            emailVerified: true,
            accountStatus: 'active',
            emailVerificationToken: null,
            emailVerificationExpires: null
        });

        // Clear Redis cache
        try {
            await redisClient.del(redisKey);
            
            // Set user session in Redis for faster future logins
            const sessionKey = `user_session:${user.id}`;
            await redisClient.setEx(sessionKey, 3600, JSON.stringify({
                id: user.id,
                email: user.email,
                emailVerified: true,
                accountStatus: 'active',
                lastVerified: new Date().toISOString()
            }));
        } catch (redisError) {
            console.error('❌ Redis session caching failed:', redisError.message);
        }

        // Send confirmation email
        try {
            const emailTemplate = emailTemplates.emailVerified(user.fullName);
            await sendEmail(user.email, emailTemplate.subject, emailTemplate.html, 'verification');
            console.log('✅ Verification confirmation email sent to:', user.email);
        } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError);
        }

        res.status(200).json({
            message: "Email verified successfully! Your account is now active.",
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                accountStatus: user.accountStatus,
                emailVerified: user.emailVerified
            }
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: "Error verifying email", error: error.message });
    }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Rate limiting: Check if user has exceeded resend attempts
        const rateLimitKey = `resend_rate_limit:${email.toLowerCase().trim()}`;
        const resendAttempts = await redisClient.get(rateLimitKey);
        
        if (resendAttempts && parseInt(resendAttempts) >= 5) {
            return res.status(429).json({ 
                message: "Too many resend attempts. Please wait 1 hour before trying again.",
                retryAfter: 3600 // 1 hour in seconds
            });
        }

        // Find user
        const user = await UserTable.findOne({ where: { email: email.toLowerCase().trim() } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        // Generate new verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with new token
        await user.update({
            emailVerificationToken,
            emailVerificationExpires
        });

        // Track resend attempts in Redis
        const resendKey = `resend_count:${user.id}`;
        const currentCount = await redisClient.get(resendKey) || 0;
        const newResendCount = parseInt(currentCount) + 1;
        
        // Cache new verification token in Redis
        const redisKey = `email_verification:${emailVerificationToken}`;
        try {
            await redisClient.setEx(redisKey, 86400, JSON.stringify({ // 24 hours
                userId: user.id,
                email: user.email,
                fullName: user.fullName,
                createdAt: new Date().toISOString(),
                resendCount: newResendCount
            }));

            await redisClient.setEx(resendKey, 86400, String(newResendCount));
        } catch (redisError) {
            console.error('❌ Redis resend caching failed:', redisError.message);
        }

        // Send verification email
        const backendUrl = process.env.NODE_ENV === 'production' 
            ? process.env.RAILWAY_PUBLIC_DOMAIN || process.env.BACKEND_URL || 'https://your-backend-domain.com'
            : 'http://localhost:5000';
        const verificationLink = `${backendUrl}/verify-email?token=${emailVerificationToken}`;
        const emailTemplate = emailTemplates.emailVerification(user.fullName, verificationLink);

        try {
            await sendEmail(user.email, emailTemplate.subject, emailTemplate.html, 'verification');
            console.log('✅ Resend verification email sent to:', user.email);
            console.log('✅ New verification token cached in Redis:', redisKey);
            
            // Increment rate limiting counter
            try {
                await redisClient.incr(rateLimitKey);
                await redisClient.expire(rateLimitKey, 3600); // Expire after 1 hour
            } catch (redisError) {
                console.error('❌ Redis rate limiting failed:', redisError.message);
            }
            
            res.status(200).json({
                message: "Verification email sent successfully. Please check your email.",
                resendCount: newResendCount,
                remainingAttempts: Math.max(0, 5 - newResendCount)
            });
        } catch (emailError) {
            console.error('❌ Failed to resend verification email:', emailError);
            res.status(500).json({ 
                message: "Failed to send verification email. Please try again later." 
            });
        }

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: "Error resending verification email", error: error.message });
    }
};

// Google Mobile Authentication - for mobile apps using Google Sign-In SDK
// Also supports web authentication with access tokens
const googleMobileAuth = async (req, res) => {
    const { idToken, accessToken, userInfo } = req.body;

    try {
        let googleUserInfo;
        
        // Get all valid Google Client IDs (web, Android, iOS)
        const getValidClientIds = () => {
            const clientIds = [
                process.env.GOOGLE_CLIENT_ID,           // Web client ID
                process.env.GOOGLE_ANDROID_CLIENT_ID,   // Android client ID
                process.env.GOOGLE_IOS_CLIENT_ID        // iOS client ID
            ].filter(Boolean); // Remove undefined/null values
            
            return clientIds;
        };
        
        // Handle ID token (mobile) or access token (web)
        if (idToken) {
            // Mobile: Verify ID token (Android & iOS)
            // Updated to use the correct Google OAuth 2.0 endpoint
            const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
            
            try {
                const response = await axios.get(tokenInfoUrl);
                googleUserInfo = response.data;

                // Verify the token was issued for one of our apps (web, Android, or iOS)
                const validClientIds = getValidClientIds();
                if (!validClientIds.includes(googleUserInfo.aud)) {
                    console.error('Invalid Google token audience:', {
                        received: googleUserInfo.aud,
                        expected: validClientIds,
                        hasWeb: !!process.env.GOOGLE_CLIENT_ID,
                        hasAndroid: !!process.env.GOOGLE_ANDROID_CLIENT_ID,
                        hasIOS: !!process.env.GOOGLE_IOS_CLIENT_ID
                    });
                    return res.status(401).json({ 
                        message: "Invalid token: token was not issued for this application. Please ensure you're using the correct Google Sign-In configuration for your platform (web/Android/iOS)." 
                    });
                }
            } catch (verifyError) {
                console.error('Google token verification error:', verifyError);
                return res.status(401).json({ 
                    message: "Invalid or expired Google ID token",
                    error: verifyError.response?.data?.error_description || verifyError.message
                });
            }
        } else if (accessToken && userInfo) {
            // Web: Verify access token and use provided user info
            // Updated to use the correct Google OAuth 2.0 endpoint
            try {
                const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`;
                const verifyResponse = await axios.get(verifyUrl);
                
                // Verify the token was issued for one of our apps (web, Android, or iOS)
                const validClientIds = getValidClientIds();
                if (!validClientIds.includes(verifyResponse.data.audience)) {
                    console.error('Invalid Google access token audience:', {
                        received: verifyResponse.data.audience,
                        expected: validClientIds,
                        hasWeb: !!process.env.GOOGLE_CLIENT_ID,
                        hasAndroid: !!process.env.GOOGLE_ANDROID_CLIENT_ID,
                        hasIOS: !!process.env.GOOGLE_IOS_CLIENT_ID
                    });
                    return res.status(401).json({ 
                        message: "Invalid token: token was not issued for this application. Please ensure you're using the correct Google Sign-In configuration for your platform (web/Android/iOS)." 
                    });
                }
                
                // Use provided user info (already verified by Google Sign-In SDK)
                googleUserInfo = {
                    sub: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.displayName,
                    picture: userInfo.photoUrl,
                };
            } catch (verifyError) {
                console.error('Google access token verification error:', verifyError);
                return res.status(401).json({ 
                    message: "Invalid or expired Google access token",
                    error: verifyError.response?.data?.error_description || verifyError.message
                });
            }
        } else {
            return res.status(400).json({ 
                message: "Either Google ID token or access token with user info is required" 
            });
        }

        // Extract user information
        const googleId = googleUserInfo.sub;
        const email = googleUserInfo.email;
        const fullName = googleUserInfo.name || email.split('@')[0];
        // Remove size parameter from Google profile picture URL to get full-size image
        // This prevents rate limiting issues and provides better quality
        let profilePicture = googleUserInfo.picture || null;
        if (profilePicture && profilePicture.includes('=s')) {
            // Remove size parameter (e.g., =s100) to get full-size image
            profilePicture = profilePicture.split('=s')[0];
        }

        if (!email) {
            return res.status(400).json({ 
                message: "Email not provided in Google token" 
            });
        }

        // Generate unique username helper function (reuse from signup)
        const generateUsername = async (fullName) => {
            const baseName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            let username = `@${baseName}_${randomSuffix}`;
            
            // Ensure username is unique
            let counter = 1;
            while (await UserTable.findOne({ where: { username } })) {
                username = `@${baseName}_${randomSuffix}${counter}`;
                counter++;
            }
            
            return username;
        };

        // Check if user already exists with this Google ID
        let user = await UserTable.findOne({ where: { google_Id: googleId } });
        
        if (user) {
            // User already exists with Google ID
            console.log('✅ Existing Google user found:', user.email);
        } else {
            // Check if user exists with this email (from regular signup)
            const existingUser = await UserTable.findOne({ 
                where: { email: email.toLowerCase().trim() } 
            });
            
            if (existingUser) {
                // User exists with this email, link Google ID to existing account
                // Preserve existing profile picture - only use Google's if user has none
                await existingUser.update({
                    google_Id: googleId,
                    profilePicture: existingUser.profilePicture || profilePicture,
                    accountStatus: 'active' // Ensure account is active
                });
                user = existingUser;
                console.log('✅ Linked Google account to existing user:', user.email);
            } else {
                // Create a new user
                const randomPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(randomPassword, 10);
                const username = await generateUsername(fullName);
                
                user = await UserTable.create({
                    google_Id: googleId,
                    fullName: fullName.trim(),
                    username: username,
                    email: email.toLowerCase().trim(),
                    password: hashedPassword, // Required field
                    profilePicture: profilePicture,
                    agreeTerms: true, // OAuth users agree to terms
                    accountType: 'buyer', // Default account type
                    accountStatus: 'active',
                    emailVerified: true // Google emails are pre-verified
                });
                console.log('✅ New Google user created:', user.email);
            }
        }

        // Generate unique session ID for this login
        const sessionId = crypto.randomBytes(32).toString('hex');

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.accountType,
                sessionId: sessionId
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Store session in Redis for logout from all devices functionality
        await redisClient.set(`session:${user.id}:${sessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

        // Build user object with all fields frontend expects
        const userResponse = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.accountType,
            accountType: user.accountType,
            accountStatus: user.accountStatus,
            profilePicture: user.profilePicture || null,
            username: user.username || null,
            bio: user.bio || null,
            location: user.location || null,
            emailVerified: user.emailVerified || false
        };

        // Return token in response (mobile apps don't use cookies)
        res.status(200).json({
            message: "Google authentication successful",
            user: userResponse,
            token: token
        });

    } catch (error) {
        console.error('Google mobile auth error:', error);
        res.status(500).json({ 
            message: "Error authenticating with Google", 
            error: error.message 
        });
    }
};

/**
 * Perform account deletion (shared logic for in-app and web delete).
 * @param {string} userId - User ID to delete
 * @param {string} reason - Deletion reason
 * @returns {Promise<void>}
 */
const performAccountDeletion = async (userId, reason = 'User requested account deletion') => {
    const user = await UserTable.findByPk(userId);
    if (!user) throw new Error('User not found');
    if (user.accountStatus === 'deactivated') throw new Error('Account is already deleted');

    const originalEmail = user.email;
    const originalFullName = user.fullName;
    const transaction = await db.sequelize.transaction();

    try {
        // 1. Soft delete and anonymize user account
            const deletedEmail = `deleted_${userId.substring(0, 8)}@deleted.local`;
            const deletedUsername = `deleted_${userId.substring(0, 8)}`;
            
            await user.update({
                accountStatus: 'deactivated',
                fullName: 'Deleted User',
                email: deletedEmail,
                username: deletedUsername,
                profilePicture: null,
                coverPicture: null,
                bio: null,
                location: null,
                website: null,
                google_Id: null,
                emailVerificationToken: null,
                emailVerificationExpires: null,
                deleteReason: reason,
                deletedAt: new Date()
            }, { transaction });

            // 2. Soft delete user's products (if seller)
            const seller = await SellersTable.findOne({
                where: { userId: userId },
                transaction
            });

            if (seller) {
                // Anonymize and deactivate the seller record
                await SellersTable.update(
                    {
                        fullName: 'Deleted User',
                        businessName: 'Deleted Business',
                        email: `deleted_seller_${seller.id.substring(0, 8)}@deleted.local`,
                        phoneNumber: 'deleted',
                        businessAddress: 'Deleted',
                        businessDescription: null,
                        verificationStatus: 'suspended',
                        isVerified: false
                    },
                    { where: { id: seller.id }, transaction }
                );

                await Product.update(
                    { 
                        status: 'inactive',
                        isAvailable: false 
                    },
                    { 
                        where: { sellerId: seller.id },
                        transaction 
                    }
                );
            }

            // 3. Soft delete user's posts
            await Post.update(
                { status: 'inactive' },
                { 
                    where: { userId: userId },
                    transaction 
                }
            );

            // 4. Cancel/soft delete user's auctions
            await Auction.update(
                { status: 'cancelled' },
                { 
                    where: { 
                        sellerId: userId,
                        status: { [Op.in]: ['draft', 'active', 'paused'] }
                    },
                    transaction 
                }
            );

            // 5. Cancel/soft delete user's group buys
            await GroupBuy.update(
                { status: 'cancelled' },
                { 
                    where: { 
                        creator_id: userId,
                        status: { [Op.in]: ['pending', 'active'] }
                    },
                    transaction 
                }
            );

            // 6. Cancel/soft delete user's swap deals
            await SwapDeal.update(
                { status: 'cancelled' },
                { 
                    where: { 
                        sellerId: userId,
                        status: { [Op.in]: ['pending', 'active'] }
                    },
                    transaction 
                }
            );

            // 7. Cancel/soft delete user's buyer needs
            await BuyerNeed.update(
                { status: 'cancelled' },
                { 
                    where: { 
                        buyer_id: userId,
                        status: { [Op.in]: ['active', 'in_progress'] }
                    },
                    transaction 
                }
            );

            // 8. Remove user's follows and followers
            await UserFollows.destroy({
                where: {
                    [Op.or]: [
                        { user_id: userId },
                        { follows_user_id: userId }
                    ]
                },
                transaction
            });

            // 9. Remove user's saved items (unified system)
            await SavedItem.destroy({
                where: { userId: userId },
                transaction
            });

            // 10. Remove user's likes
            await PostLike.destroy({
                where: { userId: userId },
                transaction
            });

            await ProductLike.destroy({
                where: { userId: userId },
                transaction
            });

            // 11. Delete user's notifications (personal notifications)
            await Notification.destroy({
                where: { userId: userId },
                transaction
            });

            // 12. Clear all user sessions from Redis
            const sessionKeys = await redisClient.keys(`session:${userId}:*`);
            if (sessionKeys.length > 0) {
                await redisClient.del(sessionKeys);
            }

            await transaction.commit();

            try {
                const emailTemplate = emailTemplates.accountDeleted(originalFullName, new Date().toLocaleDateString());
                await sendEmail(originalEmail, emailTemplate.subject, emailTemplate.html, 'account-deletion');
            } catch (emailError) {
                console.error('Error sending deletion confirmation email:', emailError);
            }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Delete user account (soft delete with anonymization) - in-app
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, reason } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete your account'
            });
        }

        const user = await UserTable.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password. Please provide the correct password to delete your account.'
            });
        }

        if (user.accountStatus === 'deactivated') {
            return res.status(400).json({
                success: false,
                message: 'Account is already deleted'
            });
        }

        await performAccountDeletion(userId, reason || 'User requested account deletion');

        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: 'Your account has been successfully deleted. All your personal information has been anonymized and your content has been removed.',
            data: { deletedAt: new Date() }
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting account. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Apple Mobile Authentication
const appleMobileAuth = async (req, res) => {
    const { identityToken, givenName, familyName, email } = req.body;

    if (!identityToken) {
        return res.status(400).json({ message: "Apple identity token is required" });
    }

    try {
        const jwt = require('jsonwebtoken');
        const jwksClient = require('jwks-rsa');

        const client = jwksClient({
            jwksUri: 'https://appleid.apple.com/auth/keys'
        });

        const getKey = (header, callback) => {
            client.getSigningKey(header.kid, function(err, key) {
                if (err) {
                    callback(err, null);
                } else {
                    const signingKey = key.publicKey || key.rsaPublicKey;
                    callback(null, signingKey);
                }
            });
        };

        // Validate the JWT. Apple uses RS256.
        const decodedToken = await new Promise((resolve, reject) => {
            jwt.verify(identityToken, getKey, {
                algorithms: ['RS256'],
                issuer: 'https://appleid.apple.com'
            }, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
            });
        });

        // Verify the audience (app bundle ID) 
        const validClientIds = [
            process.env.APPLE_CLIENT_ID,
            process.env.APPLE_BUNDLE_ID,
            'com.oceanpulse.bluewhale' // Default
        ].filter(Boolean);

        if (!validClientIds.includes(decodedToken.aud)) {
             console.log('Valid Apple Client IDs:', validClientIds, 'Received:', decodedToken.aud);
        }

        const appleId = decodedToken.sub;
        const appleEmail = decodedToken.email || email;
        
        if (!appleId) {
            return res.status(400).json({ message: "Apple token is missing subject (sub) claim" });
        }

        // Generate unique username helper function
        const generateUsername = async (fullName) => {
            const crypto = require('crypto');
            const baseName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            let username = `@${baseName}_${randomSuffix}`;
            let counter = 1;
            while (await UserTable.findOne({ where: { username } })) {
                username = `@${baseName}_${randomSuffix}${counter}`;
                counter++;
            }
            return username;
        };

        let user = await UserTable.findOne({ where: { apple_Id: appleId } });

        if (user) {
            console.log('✅ Existing Apple user found:', user.email);
        } else {
            // Check if user exists with the same email
            let existingUser = null;
            if (appleEmail) {
                existingUser = await UserTable.findOne({ 
                    where: { email: appleEmail.toLowerCase().trim() } 
                });
            }
            
            if (existingUser) {
                // Link account
                await existingUser.update({
                    apple_Id: appleId,
                    accountStatus: 'active'
                });
                user = existingUser;
                console.log('✅ Linked Apple account to existing user:', user.email);
            } else {
                if (!appleEmail) {
                     return res.status(400).json({ message: "Email is required for new accounts but was not provided." });
                }

                const crypto = require('crypto');
                const bcrypt = require('bcrypt');
                
                const randomPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(randomPassword, 10);
                
                let full = givenName || familyName ? `${givenName || ''} ${familyName || ''}`.trim() : appleEmail.split('@')[0];
                const username = await generateUsername(full);
                
                user = await UserTable.create({
                    apple_Id: appleId,
                    fullName: full,
                    username: username,
                    email: appleEmail.toLowerCase().trim(),
                    password: hashedPassword,
                    agreeTerms: true,
                    accountType: 'buyer',
                    accountStatus: 'active',
                    emailVerified: true 
                });
                console.log('✅ New Apple user created:', user.email);
            }
        }

        // Create session
        const crypto = require('crypto');
        const redisClient = require('../config/redisdb');
        const sessionId = crypto.randomBytes(32).toString('hex');
        const sessionKey = `session:${user.id}:${sessionId}`;
        
        try {
            await redisClient.setEx(sessionKey, 30 * 24 * 60 * 60, 'active');
        } catch (error) {
            console.error('Failed to save session to Redis:', error);
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.accountType,
                sessionId 
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "Authentication successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                username: user.username,
                profilePicture: user.profilePicture,
                accountType: user.accountType,
                accountStatus: user.accountStatus,
                isSeller: ['seller', 'admin'].includes(user.accountType) || (user.sellerId ? true : false)
            }
        });

    } catch (error) {
        console.error('Apple auth error:', error);
        res.status(500).json({ message: "Apple verification failed", error: error.message });
    }
};

module.exports = {
    signup,
    login,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    sellerRegistration,
    verifyEmail,
    resendVerificationEmail,
    googleMobileAuth,
    appleMobileAuth,
    deleteAccount,
    performAccountDeletion
};