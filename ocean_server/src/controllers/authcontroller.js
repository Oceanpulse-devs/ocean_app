const {UserTable, SellersTable, SellerDocument} = require('../../models')
const { sendSellerApplicationNotification, sendAdminNotification } = require('./notificationController')
const { sendEmail, emailTemplates } = require('../services/emailService')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
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
    
    const newUser = await UserTable.create({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
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
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`
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

    res.status(200).json({
        message:"User successfully signed in.",
        user:{
            id: existingUser.id,
            fullName: existingUser.fullName,
            email: existingUser.email,
            role: existingUser.accountType, // Current role for permissions
            accountType: existingUser.accountType, // Account classification
            accountStatus: existingUser.accountStatus
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

        // Send notification to user
        await sendSellerApplicationNotification(currentUserId, 'submitted');

        // Send notification to admins
        await sendAdminNotification(businessName);

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





// Verify email address
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Verification token is required" });
        }

        // Check Redis cache first for faster verification
        let user;
        try {
            const redisKey = `email_verification:${token}`;
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
                        [where.gt]: new Date() // Token not expired
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

        // Cache new verification token in Redis
        try {
            const redisKey = `email_verification:${emailVerificationToken}`;
            await redisClient.setEx(redisKey, 86400, JSON.stringify({ // 24 hours
                userId: user.id,
                email: user.email,
                fullName: user.fullName,
                createdAt: new Date().toISOString(),
                resendCount: (await redisClient.get(`resend_count:${user.id}`) || 0) + 1
            }));

            // Track resend attempts in Redis
            const resendKey = `resend_count:${user.id}`;
            const currentCount = await redisClient.get(resendKey) || 0;
            await redisClient.setEx(resendKey, 86400, parseInt(currentCount) + 1);
        } catch (redisError) {
            console.error('❌ Redis resend caching failed:', redisError.message);
        }

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
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
                resendCount: parseInt(currentCount) + 1,
                remainingAttempts: Math.max(0, 5 - (parseInt(resendAttempts) + 1))
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

module.exports = {
    signup,
    login,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    sellerRegistration,
    verifyEmail,
    resendVerificationEmail
};