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

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// Configure multer for file uploads - use memory storage for better compatibility
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (for videos)
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

// Create a simpler upload for posts
const postUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
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

// Email verification route - handles verification links from emails
app.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Email Verification - Ocean App</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .error { color: #e74c3c; }
                        .success { color: #27ae60; }
                        .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2 class="error">❌ Invalid Verification Link</h2>
                        <p>The verification link is missing or invalid.</p>
                        <a href="#" onclick="window.close()" class="btn">Close</a>
                    </div>
                </body>
                </html>
            `);
        }

        // Call the verification function directly instead of making HTTP request
        console.log(`🔍 Verifying token: ${token.substring(0, 10)}...`);
        
        // Import the verification function
        const { verifyEmail } = require('./src/controllers/authcontroller');
        
        // Create a mock request/response to call the verification function
        const mockReq = {
            body: { token },
            protocol: req.protocol,
            get: (header) => req.get(header)
        };
        
        let result = { success: false, message: 'Verification failed' };
        let statusCode = 400;
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    statusCode = code;
                    result = data;
                    return { statusCode: code, data };
                }
            }),
            json: (data) => {
                statusCode = 200;
                result = data;
                return { statusCode: 200, data };
            }
        };
        
        try {
            await verifyEmail(mockReq, mockRes);
            // The result and statusCode are set by the mockRes methods above
        } catch (error) {
            console.error('Verification error:', error);
            result = { 
                success: false, 
                message: 'Verification failed: ' + error.message 
            };
            statusCode = 500;
        }

        if (statusCode === 200 && !result.message?.includes('already verified')) {
            // Success page
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Email Verified - Ocean App</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .success { color: #27ae60; }
                        .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                        .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2 class="success">🎉 Email Verified Successfully!</h2>
                        <p>Your email has been verified. You can now use all features of Ocean App.</p>
                        <div class="info">
                            <h3>📱 Next Steps:</h3>
                            <p>1. Open the Ocean App on your mobile device</p>
                            <p>2. Log in with your verified account</p>
                            <p>3. Start exploring and connecting!</p>
                        </div>
                        <a href="#" onclick="window.close()" class="btn">Close</a>
                    </div>
                </body>
                </html>
            `);
        } else if (result.message?.includes('already verified')) {
            // Already verified page
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Already Verified - Ocean App</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .info { color: #3498db; }
                        .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2 class="info">✅ Email Already Verified</h2>
                        <p>Your email is already verified! You can use all features of Ocean App.</p>
                        <div class="info">
                            <h3>📱 Next Steps:</h3>
                            <p>1. Open the Ocean App on your mobile device</p>
                            <p>2. Log in with your verified account</p>
                            <p>3. Start exploring and connecting!</p>
                        </div>
                        <a href="#" onclick="window.close()" class="btn">Close</a>
                    </div>
                </body>
                </html>
            `);
        } else {
            // Error page
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Verification Failed - Ocean App</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .error { color: #e74c3c; }
                        .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2 class="error">❌ Verification Failed</h2>
                        <p>${result.message || 'The verification link is invalid or has expired.'}</p>
                        <p>Please request a new verification email from the app.</p>
                        <a href="#" onclick="window.close()" class="btn">Close</a>
                    </div>
                </body>
                </html>
            `);
        }

    } catch (error) {
        console.error('Email verification route error:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Server Error - Ocean App</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .error { color: #e74c3c; }
                    .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 class="error">⚠️ Server Error</h2>
                    <p>Something went wrong. Please try again later.</p>
                    <a href="#" onclick="window.close()" class="btn">Close</a>
                </div>
            </body>
            </html>
        `);
    }
});

app.use(cors({
    origin: true,
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
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');

app.use('/', authRoutes);
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
app.use('/api/admin', adminRoutes);
app.use('/api/distress-sales', distressSaleRoutes);
app.use('/api/heavy-distributors', heavyDistributorRoutes);
app.use('/api/seller-verification', sellerVerificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);



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
// Initialize notification scheduler
const notificationScheduler = require('./src/services/notificationScheduler');

// Run scheduled checks every hour
setInterval(async () => {
  try {
    await notificationScheduler.runScheduledChecks();
  } catch (error) {
    console.error('Error in scheduled notification checks:', error);
  }
}, 60 * 60 * 1000); // 1 hour

// Run initial check after 5 minutes
setTimeout(async () => {
  try {
    console.log('🕐 Running initial notification check...');
    await notificationScheduler.runScheduledChecks();
  } catch (error) {
    console.error('Error in initial notification check:', error);
  }
}, 5 * 60 * 1000); // 5 minutes

// Run performance analytics daily at 2 AM
setInterval(async () => {
  try {
    console.log('📊 Running daily performance analytics...');
    await notificationScheduler.runPerformanceAnalytics();
  } catch (error) {
    console.error('Error in daily performance analytics:', error);
  }
}, 24 * 60 * 60 * 1000); // 24 hours

app.listen(port , ()=>{
    console.log(`● Server running on port ${port} ✅`)
})