const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const multer = require('multer');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Make upload available to routes
app.locals.upload = upload;

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

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

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Mobile app health check endpoint
app.get('/api/mobile/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'Ocean Backend API',
        version: process.env.MOBILE_API_VERSION || 'v1',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: 'Connected',
        redis: 'Connected',
        cors: 'Enabled for mobile apps'
    });
});

// Mobile app configuration endpoint
app.get('/api/mobile/config', (req, res) => {
    res.status(200).json({
        apiVersion: process.env.MOBILE_API_VERSION || 'v1',
        baseUrl: process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL 
            : `http://localhost:${process.env.PORT || 5000}`,
        features: {
            authentication: true,
            products: true,
            auctions: true,
            messaging: true,
            notifications: true,
            fileUpload: true,
            oauth: !!(process.env.GOOGLE_CLIENT_ID && process.env.FACEBOOK_APP_ID)
        },
        limits: {
            maxFileSize: '10MB',
            maxImagesPerProduct: 10,
            maxImagesPerPost: 10
        }
    });
});

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [
            process.env.FRONTEND_URL, 
            'https://your-frontend-domain.com',
            // Add mobile app origins here
            'capacitor://localhost',
            'ionic://localhost',
            'http://localhost:8100', // Ionic dev server
            'http://localhost:8080', // Capacitor dev server
            process.env.MOBILE_APP_URL // Add this to your env
          ]
        : [
            'http://localhost:3000', 
            'http://localhost:5173', 
            'http://127.0.0.1:3000', 
            'http://127.0.0.1:5173',
            // Mobile development origins
            'http://localhost:8100',
            'http://localhost:8080',
            'capacitor://localhost',
            'ionic://localhost'
          ],
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-Total-Count']
}));



//routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const followRoutes = require('./src/routes/followRoutes');
const feedRoutes = require('./src/routes/feedRoutes');
const productRoutes = require('./src/routes/productRoutes');
const auctionRoutes = require('./src/routes/auctionRoutes');
const groupBuyRoutes = require('./src/routes/groupBuyRoutes');
const swapDealRoutes = require('./src/routes/swapDealRoutes');
const buyerNeedRoutes = require('./src/routes/buyerNeedRoutes');
const marketAnalyticsRoutes = require('./src/routes/marketAnalyticsRoutes');
const advancedNotificationRoutes = require('./src/routes/advancedNotificationRoutes');
const distressSaleRoutes = require('./src/routes/distressSaleRoutes');
const heavyDistributorRoutes = require('./src/routes/heavyDistributorRoutes');
const sellerVerificationRoutes = require('./src/routes/sellerVerificationRoutes');

app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', notificationRoutes);
app.use('/', followRoutes);
app.use('/', feedRoutes);
app.use('/', productRoutes);
app.use('/', auctionRoutes);
app.use('/api/group-buy', groupBuyRoutes);
app.use('/api/swap-deals', swapDealRoutes);
app.use('/api/buyer-needs', buyerNeedRoutes);
app.use('/api/market-analytics', marketAnalyticsRoutes);
app.use('/api/advanced-notifications', advancedNotificationRoutes);
app.use('/api/distress-sales', distressSaleRoutes);
app.use('/api/heavy-distributors', heavyDistributorRoutes);
app.use('/api/seller-verification', sellerVerificationRoutes);



// Database sync with safe options - won't drop existing tables
db.sequelize.sync({ 
    force: false,  // Don't drop tables
    alter: false   // Don't alter existing tables - just ensure they exist
}).then(() => {
    console.log('✅ Database synchronized safely');
    
    // After sync, update any NULL timestamps to current time
    return db.sequelize.query(`
        UPDATE users 
        SET createdAt = NOW(), updatedAt = NOW() 
        WHERE createdAt IS NULL OR updatedAt IS NULL
    `);
}).then(() => {
    console.log('✅ Timestamps updated for existing users');
}).catch((error) => {
    console.error('❌ Database sync error:', error);
});
app.listen(port , ()=>{
    console.log(`● Server running on port ${port} ✅`)
})