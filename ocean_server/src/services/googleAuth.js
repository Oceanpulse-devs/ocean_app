// Google Authentication Service using passport-google-oauth20
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');
// Import User model
const UserTable = require('../../models/UserTable');
// Configure the Google Strategy for use by Passport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID ,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ,
    callbackURL: process.env.GOOGLE_CALLBACK_URL ,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user already exists in the database
            let user = await UserTable.findOne({ where: { google_Id: profile.id } });
            
            if (user) {
                // User already exists, return the user
                return done(null, user);
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
                    accountStatus: 'active'
                });
                return done(null, user);
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