const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const port = process.env.PORT || 5000
const redisClient = require('./src/config/redisdb')
const db = require('./models')
const pool = require('./src/config/database')
const cookieParser = require('cookie-parser')
// Initialize OAuth services only if environment variables are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    require('./src/services/googleAuth'); // Initialize Google Auth service
    console.log('✅ Google OAuth service initialized');
} else {
    console.log('⚠️  Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    require('./src/services/facebookAuth'); // Initialize Facebook Auth service
    console.log('✅ Facebook OAuth service initialized');
} else {
    console.log('⚠️  Facebook OAuth not configured - missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET');
}




const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Session configuration for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // Allow cookies to be sent with requests
}));



//routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const followRoutes = require('./src/routes/followRoutes');

app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', notificationRoutes);
app.use('/', followRoutes);



db.sequelize.sync().then((req)=>{})
app.listen(port , ()=>{
    console.log(`● Server running on port ${port} ✅`)
})