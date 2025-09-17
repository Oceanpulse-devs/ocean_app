// Google Authentication Service using passport-google-oauth20
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');
// Import User model
const { UserTable } = require('../../models');
// Configure the Google Strategy for use by Passport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
        ? `${process.env.BACKEND_URL || 'https://your-backend-domain.com'}/api/auth/google/callback`
        : 'http://localhost:5000/api/auth/google/callback',
    scope: ['profile', 'email'],
    prompt: 'consent', // Force consent screen to appear
    accessType: 'offline', // Request refresh token
    includeGrantedScopes: true, // Include previously granted scopes
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user already exists with this Google ID
            let user = await UserTable.findOne({ where: { google_Id: profile.id } });
            
            if (user) {
                // User already exists with Google ID, return the user
                return done(null, user);
            } else {
                // Check if user exists with this email (from regular signup)
                const existingUser = await UserTable.findOne({ 
                    where: { email: profile.emails[0].value } 
                });
                
                if (existingUser) {
                    // User exists with this email, link Google ID to existing account
                    await existingUser.update({
                        google_Id: profile.id,
                        profilePicture: profile._json.picture || existingUser.profilePicture,
                        accountStatus: 'active' // Ensure account is active
                    });
                    return done(null, existingUser);
                } else {
                    // Generate a random password for OAuth users
                    const randomPassword = Math.random().toString(36).slice(-8);
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);
                    
                    // Create a new user
                    user = await UserTable.create({
                        google_Id: profile.id,
                        fullName: profile.displayName,
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        password: hashedPassword, // Required field
                        profilePicture: profile._json.picture,
                        agreeTerms: true, // OAuth users agree to terms
                        accountType: 'buyer', // Default account type
                        accountStatus: 'active',
                        emailVerified: true // Google emails are pre-verified
                    });
                    return done(null, user);
                }
            }
        } catch (err) {
            console.error('Google OAuth Error:', err);
            return done(err, null);
        }
    }
));
// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserTable.findByPk(id);
        done(null, user);
    } catch (err) {
        console.error(err);
        done(err, null);
    }
});
// Export the configured passport instance
module.exports = passport;