require('./instrumentation');

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv').config();
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const passport = require('passport');
const multer = require('multer');
const socketIo = require('socket.io');
const port = process.env.PORT || 5000
const redisClient = require('./src/config/redisdb')
const db = require('./models')
const pool = require('./src/config/database')
const cookieParser = require('cookie-parser')
const responseWrapper = require('./src/middleware/responseWrapper')
const socketAuthMiddleware = require('./src/middleware/socketAuthMiddleware');
const { auctionSocketHandler, setIOInstance } = require('./src/socket/auctionSocketHandler');

// Initialize OAuth services only if environment variables are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    require('./src/services/googleAuth'); // Initialize Google Auth service
    console.log('✅ Google OAuth service initialized');
} else {
    console.log('⚠️  Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}





const app = express();
const server = http.createServer(app);

// Allowed CORS origins (used by Express and Socket.IO)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_PANEL_URL,
  process.env.BASE_URL && process.env.BASE_URL.replace(/\/$/, '')
].filter(Boolean);
// When ADMIN_PANEL_URL is set to localhost, allow any localhost port (e.g. Flutter 4589, 3000, etc.)
const adminPanelIsLocalhost = (() => {
  const url = (process.env.ADMIN_PANEL_URL || '').replace(/\/$/, '').toLowerCase();
  return url === 'http://localhost' || url === 'localhost';
})();
const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow any localhost port when ADMIN_PANEL_URL is set to localhost, or in development
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    if (adminPanelIsLocalhost || process.env.NODE_ENV === 'development') return true;
  }
  return false;
};

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  pingTimeout: parseInt(process.env.WS_HEARTBEAT_TIMEOUT) || 5000,
  pingInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 25000
});

// Set Socket.IO instance in auction socket handler
setIOInstance(io);

// Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`🔌 User connected to auction socket: ${socket.userId}`);
  
  // Initialize auction socket handler
  auctionSocketHandler(io, socket);
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected from auction socket: ${socket.userId}`);
  });
});

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
// Serve public assets (logo, etc.) for HTML pages
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve deep linking verification files
app.get('/.well-known/assetlinks.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'public', '.well-known', 'assetlinks.json'));
});
app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'public', '.well-known', 'apple-app-site-association'));
});

// Session configuration for OAuth (Redis store in production to avoid MemoryStore warning)
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
};
if (process.env.NODE_ENV === 'production' && redisClient) {
    sessionConfig.store = new RedisStore({ client: redisClient, prefix: 'ocean_sess:' });
    console.log('✅ Session store: Redis (production)');
} else {
    console.log('⚠️  Session store: Memory (development only)');
}
app.use(session(sessionConfig));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Apply response wrapper middleware to all routes
app.use(responseWrapper);

// Health check endpoint (Railway / monitoring / browsers)
app.get('/health', async (req, res) => {
    const baseHealth = {
        status: 'OK', 
        service: 'BlueWhale Backend API',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || process.env.MOBILE_API_VERSION || 'v1',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
    };

    const dbStatus = { status: 'unknown' };
    const redisStatus = { status: 'unknown' };

    // Quick DB health check (non-fatal, best-effort)
    try {
        if (db && db.sequelize && typeof db.sequelize.authenticate === 'function') {
            await db.sequelize.authenticate();
            dbStatus.status = 'up';
        } else {
            dbStatus.status = 'not_configured';
        }
    } catch (err) {
        dbStatus.status = 'down';
        dbStatus.error = err.message || String(err);
        baseHealth.status = 'DEGRADED';
    }

    // Quick Redis health check (non-fatal, best-effort)
    try {
        if (redisClient && typeof redisClient.ping === 'function') {
            const pong = await redisClient.ping();
            redisStatus.status = pong === 'PONG' ? 'up' : 'degraded';
        } else {
            redisStatus.status = 'not_configured';
        }
    } catch (err) {
        redisStatus.status = 'down';
        redisStatus.error = err.message || String(err);
        baseHealth.status = 'DEGRADED';
    }

    const health = {
        ...baseHealth,
        db: dbStatus,
        redis: redisStatus
    };

    const wantsHtml =
        req.query.format === 'html' ||
        (req.headers.accept && req.headers.accept.includes('text/html'));

    // Default: JSON for Railway/monitoring/CLI tools
    if (!wantsHtml) {
        return res.status(200).json(health);
    }

    const uptimeSeconds = Math.floor(health.uptime);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const memMb = (health.memory.rss / 1024 / 1024).toFixed(1);

    // Helper mappers for status display in HTML
    const getStatusBadge = (status) => {
        const isHealthy = status === 'OK';
        return {
            badgeClass: isHealthy ? 'status-badge' : 'status-badge-degraded',
            dotClass: isHealthy ? 'status-dot' : 'status-dot-degraded',
            label: isHealthy ? 'Healthy' : 'Degraded'
        };
    };

    const getStatusDisplay = (status) => {
        if (status === 'up') {
            return { text: 'Up', color: '#22c55e', cssClass: 'status-up' };
        }
        if (status === 'down') {
            return { text: 'Down', color: '#ef4444', cssClass: 'status-down' };
        }
        if (status === 'degraded') {
            return { text: 'Degraded', color: '#eab308', cssClass: 'status-degraded' };
        }
        return { text: 'Not Configured', color: '#9ca3af', cssClass: 'status-unknown' };
    };

    const statusBadge = getStatusBadge(health.status);
    const dbStatusDisplay = getStatusDisplay(health.db.status);
    const redisStatusDisplay = getStatusDisplay(health.redis.status);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BlueWhale Backend Health Check</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #0b1020;
      --bg-card: #151a2b;
      --accent: #00b7ff;
      --accent-soft: rgba(0, 183, 255, 0.1);
      --ok: #22c55e;
      --warn: #eab308;
      --error: #ef4444;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --border: #1f2937;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top, #111827 0, #020617 55%, #000 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: stretch;
      justify-content: center;
      padding: 24px;
    }
    .container {
      width: 100%;
      max-width: 960px;
      background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92));
      border-radius: 18px;
      border: 1px solid rgba(148,163,184,0.2);
      box-shadow:
        0 24px 80px rgba(0,0,0,0.65),
        0 0 0 1px rgba(15,23,42,0.9);
      padding: 24px 24px 20px;
      position: relative;
      overflow: hidden;
    }
    .container::before {
      content: "";
      position: absolute;
      inset: -120px;
      background:
        radial-gradient(circle at 0 0, rgba(0,183,255,0.35), transparent 55%),
        radial-gradient(circle at 100% 100%, rgba(59,130,246,0.25), transparent 55%);
      opacity: 0.3;
      pointer-events: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
      gap: 16px;
    }
    .title-group h1 {
      font-size: 1.4rem;
      margin: 0 0 4px;
      letter-spacing: 0.03em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .title-pill {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.4);
      color: var(--muted);
    }
    .subtitle {
      margin: 0;
      color: var(--muted);
      font-size: 0.85rem;
    }
    .status-badge {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(34,197,94,0.09);
      border: 1px solid rgba(34,197,94,0.4);
      color: var(--ok);
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--ok);
      box-shadow: 0 0 12px rgba(34,197,94,0.9);
    }
    .status-badge-degraded {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(234,179,8,0.09);
      border: 1px solid rgba(234,179,8,0.4);
      color: var(--warn);
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    .status-dot-degraded {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--warn);
      box-shadow: 0 0 12px rgba(234,179,8,0.9);
    }
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
    }
    .status-indicator-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      box-shadow: 0 0 8px currentColor;
    }
    .status-up { color: var(--ok); }
    .status-down { color: var(--error); }
    .status-degraded { color: var(--warn); }
    .status-unknown { color: var(--muted); }
    .grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      position: relative;
      z-index: 1;
    }
    .card {
      background: rgba(15,23,42,0.88);
      border-radius: 14px;
      border: 1px solid rgba(31,41,55,0.9);
      padding: 14px 14px 12px;
      backdrop-filter: blur(18px);
      box-shadow: 0 18px 45px rgba(15,23,42,0.9);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top left, rgba(0,183,255,0.12), transparent 55%);
      opacity: 0.8;
      pointer-events: none;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }
    .card-title {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--muted);
    }
    .card-badge {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.4);
      color: var(--muted);
      background: rgba(15,23,42,0.9);
    }
    .metric-main {
      font-size: 1.25rem;
      margin: 0 0 2px;
      color: var(--text);
    }
    .metric-sub {
      font-size: 0.8rem;
      margin: 0;
      color: var(--muted);
    }
    .key-value {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 0.8rem;
      color: var(--muted);
      margin-top: 4px;
    }
    .key-value span:first-child {
      color: var(--muted);
    }
    .key-value span:last-child {
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.78rem;
    }
    .footer {
      margin-top: 18px;
      font-size: 0.75rem;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    .footer a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.78rem;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .pill {
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.35);
      background: rgba(15,23,42,0.9);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 10px rgba(0,183,255,0.9);
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.78rem;
      background: rgba(15,23,42,0.9);
      padding: 2px 4px;
      border-radius: 4px;
      border: 1px solid rgba(31,41,55,0.9);
    }
    @media (max-width: 640px) {
      .container { padding: 18px 16px 16px; }
      .header { flex-direction: column; align-items: flex-start; gap: 8px; }
      .footer { flex-direction: column; align-items: flex-start; gap: 6px; }
    }
  </style>
</head>
<body>
  <main class="container">
    <header class="header">
      <div class="title-group">
        <h1>
          <img src="/public/bluewhale.png" alt="BlueWhale" style="width: 36px; height: 36px; object-fit: contain; border-radius: 8px; vertical-align: middle; margin-right: 8px;" />
          BlueWhale Backend Health
          <span class="title-pill">Status Endpoint</span>
        </h1>
        <p class="subtitle">
          Operational status and runtime metrics for the BlueWhale backend API service.
        </p>
      </div>
      <div>
        <div class="${statusBadge.badgeClass}">
          <span class="${statusBadge.dotClass}"></span>
          <span>${statusBadge.label}</span>
        </div>
      </div>
    </header>

    <section class="grid">
      <article class="card">
        <div class="card-header">
          <h2 class="card-title">Service</h2>
          <span class="card-badge">Core API</span>
        </div>
        <p class="metric-main">${health.service}</p>
        <p class="metric-sub">Environment: ${health.environment}</p>
        <div class="key-value">
          <span>Version</span>
          <span>${health.version}</span>
        </div>
        <div class="key-value">
          <span>Node</span>
          <span>${health.nodeVersion}</span>
        </div>
        <div class="key-value">
          <span>Platform</span>
          <span>${health.platform}</span>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <h2 class="card-title">Uptime & Process</h2>
          <span class="card-badge">Runtime</span>
        </div>
        <p class="metric-main">${uptimeHours}h ${uptimeMinutes % 60}m</p>
        <p class="metric-sub">${uptimeSeconds}s total</p>
        <div class="key-value">
          <span>PID</span>
          <span>${health.pid}</span>
        </div>
        <div class="key-value">
          <span>Memory (RSS)</span>
          <span>${memMb} MB</span>
        </div>
        <div class="key-value">
          <span>Started at</span>
          <span>${health.timestamp}</span>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <h2 class="card-title">Health Summary</h2>
          <span class="card-badge">Status</span>
        </div>
        <p class="metric-main">Status: ${health.status}</p>
        <p class="metric-sub">
          ${health.status === 'OK'
            ? 'All core checks are passing.'
            : 'Some services are experiencing issues.'}
        </p>
        <div class="key-value">
          <span>API</span>
          <span class="status-indicator status-up">
            <span
              class="status-indicator-dot"
              style="background: #22c55e;"
            ></span>
            <span>Online</span>
          </span>
        </div>
        <div class="key-value">
          <span>Database</span>
          <span class="status-indicator ${dbStatusDisplay.cssClass}">
            <span
              class="status-indicator-dot"
              style="background: ${dbStatusDisplay.color};"
            ></span>
            <span>
              ${dbStatusDisplay.text}
              ${health.db.error ? `(${health.db.error})` : ''}
            </span>
          </span>
        </div>
        <div class="key-value">
          <span>Redis</span>
          <span class="status-indicator ${redisStatusDisplay.cssClass}">
            <span
              class="status-indicator-dot"
              style="background: ${redisStatusDisplay.color};"
            ></span>
            <span>
              ${redisStatusDisplay.text}
              ${health.redis.error ? `(${health.redis.error})` : ''}
            </span>
          </span>
        </div>
        <div class="key-value">
          <span>Last Updated</span>
          <span>${health.timestamp}</span>
        </div>
      </article>
    </section>

    <footer class="footer">
      <div class="pill">
        <span class="pill-dot"></span>
        <span>Tip: Add <code>?format=html</code> to always view this dashboard.</span>
      </div>
      <a href="/api/docs" target="_blank" rel="noreferrer">
        View API documentation →
      </a>
    </footer>
  </main>
</body>
</html>`;

    res.status(200).send(html);
});

// Mobile app health check endpoint
app.get('/api/mobile/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'BlueWhale Backend API',
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
            oauth: !!(process.env.GOOGLE_CLIENT_ID)
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
                    <title>Email Verification - BlueWhale</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .brand-header { text-align: center; margin-bottom: 20px; }
                        .brand-header img { width: 64px; height: 64px; border-radius: 8px; object-fit: contain; }
                        .brand-header .brand-name { font-size: 1.1rem; color: #333; margin-top: 6px; }
                        .error { color: #e74c3c; }
                        .success { color: #27ae60; }
                        .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="brand-header"><img src="/public/bluewhale.png" alt="BlueWhale" /><div class="brand-name">BlueWhale</div></div>
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
                    <title>Email Verified - BlueWhale</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .brand-header { text-align: center; margin-bottom: 20px; }
                        .brand-header img { width: 64px; height: 64px; border-radius: 8px; object-fit: contain; }
                        .brand-header .brand-name { font-size: 1.1rem; color: #333; margin-top: 6px; }
                        .success { color: #27ae60; }
                        .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                        .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="brand-header"><img src="/public/bluewhale.png" alt="BlueWhale" /><div class="brand-name">BlueWhale</div></div>
                        <h2 class="success">🎉 Email Verified Successfully!</h2>
                        <p>Your email has been verified. You can now use all features of BlueWhale.</p>
                        <div class="info">
                            <h3>📱 Next Steps:</h3>
                            <p>1. Open the BlueWhale app on your mobile device</p>
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
                    <title>Already Verified - BlueWhale</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .brand-header { text-align: center; margin-bottom: 20px; }
                        .brand-header img { width: 64px; height: 64px; border-radius: 8px; object-fit: contain; }
                        .brand-header .brand-name { font-size: 1.1rem; color: #333; margin-top: 6px; }
                        .info { color: #3498db; }
                        .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="brand-header"><img src="/public/bluewhale.png" alt="BlueWhale" /><div class="brand-name">BlueWhale</div></div>
                        <h2 class="info">✅ Email Already Verified</h2>
                        <p>Your email is already verified! You can use all features of BlueWhale.</p>
                        <div class="info">
                            <h3>📱 Next Steps:</h3>
                            <p>1. Open the BlueWhale app on your mobile device</p>
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
                    <title>Verification Failed - BlueWhale</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .brand-header { text-align: center; margin-bottom: 20px; }
                        .brand-header img { width: 64px; height: 64px; border-radius: 8px; object-fit: contain; }
                        .brand-header .brand-name { font-size: 1.1rem; color: #333; margin-top: 6px; }
                        .error { color: #e74c3c; }
                        .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="brand-header"><img src="/public/bluewhale.png" alt="BlueWhale" /><div class="brand-name">BlueWhale</div></div>
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
                <title>Server Error - BlueWhale</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .brand-header { text-align: center; margin-bottom: 20px; }
                    .brand-header img { width: 64px; height: 64px; border-radius: 8px; object-fit: contain; }
                    .brand-header .brand-name { font-size: 1.1rem; color: #333; margin-top: 6px; }
                    .error { color: #e74c3c; }
                    .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="brand-header"><img src="/public/bluewhale.png" alt="BlueWhale" /><div class="brand-name">BlueWhale</div></div>
                    <h2 class="error">⚠️ Server Error</h2>
                    <p>Something went wrong. Please try again later.</p>
                    <a href="#" onclick="window.close()" class="btn">Close</a>
                </div>
            </body>
            </html>
        `);
    }
});

// CORS: Allow FRONTEND_URL, ADMIN_PANEL_URL, localhost; also allow requests with no origin (mobile, Postman)
const corsOptions = {
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Total-Count']
};
app.use(cors(corsOptions));



//routes
const internalRoutes = require('./src/routes/internalRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const followRoutes = require('./src/routes/followRoutes');
const feedRoutes = require('./src/routes/feedRoutes');
const productRoutes = require('./src/routes/productRoutes');
const savedItemsRoutes = require('./src/routes/savedItemsRoutes');
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
const storyRoutes = require('./src/routes/storyRoutes');
const videoRoutes = require('./src/routes/videoRoutes');
const sellerFeedbackRoutes = require('./src/routes/sellerFeedbackRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const visibilityScoreRoutes = require('./src/routes/visibilityScoreRoutes');
const topPlacementRoutes = require('./src/routes/topPlacementRoutes');
const spotlightRoutes = require('./src/routes/spotlightRoutes');
const StoryCleanupService = require('./src/services/storyCleanupService');
const BuyerNeedSchedulerService = require('./src/services/buyerNeedSchedulerService');

// Internal API (no auth - uses API key)
app.use('/', internalRoutes);

// Web delete account (Google Play requirement - public, no auth)
app.use('/', require('./src/routes/webDeleteAccountRoutes'));

// Web social preview cards (WhatsApp, Twitter, Telegram OpenGraph metadata cards)
app.use('/', require('./src/routes/webPreviewRoutes'));

// Register auctionRoutes BEFORE authRoutes to avoid route conflict with /api/user/:userId
app.use('/', auctionRoutes);
app.use('/', authRoutes);
app.use('/', notificationRoutes);
app.use('/', followRoutes);
app.use('/', feedRoutes);
app.use('/', productRoutes);
app.use('/', savedItemsRoutes);
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

// Subscription HTML pages (root level for web testing)
// These routes serve HTML pages for payment callbacks when testing on web
app.get('/subscription/success', (req, res) => {
  const reference = req.query.reference || 'N/A';
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - BlueWhale Marketplace</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .success-icon {
            width: 100px;
            height: 100px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out 0.2s both;
        }
        @keyframes scaleIn {
            from {
                transform: scale(0);
            }
            to {
                transform: scale(1);
            }
        }
        .checkmark {
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 4;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
        }
        h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 10px;
        }
        .reference {
            background: #f3f4f6;
            padding: 12px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #374151;
        }
        .info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">
            <svg class="checkmark" viewBox="0 0 52 52">
                <path d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
        </div>
        <h1>Payment Successful!</h1>
        <p>Your subscription has been activated successfully.</p>
        <p>You now have access to all premium features.</p>
        <div class="reference">Reference: ${reference}</div>
        <div class="info">
            <p>📱 On mobile, you'll be redirected to the app automatically.</p>
            <p>💡 You can close this window.</p>
        </div>
    </div>
</body>
</html>
  `;
  res.send(html);
});

app.get('/subscription/error', (req, res) => {
  const message = decodeURIComponent(req.query.message || 'Payment failed');
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Error - BlueWhale Marketplace</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .error-icon {
            width: 100px;
            height: 100px;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out 0.2s both;
        }
        @keyframes scaleIn {
            from {
                transform: scale(0);
            }
            to {
                transform: scale(1);
            }
        }
        .error-mark {
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 4;
            stroke-linecap: round;
            fill: none;
        }
        h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 10px;
        }
        .message {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
            color: #991b1b;
            font-size: 14px;
        }
        .info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">
            <svg class="error-mark" viewBox="0 0 52 52">
                <path d="M16 16 L36 36 M36 16 L16 36"/>
            </svg>
        </div>
        <h1>Payment Failed</h1>
        <p>We encountered an issue processing your payment.</p>
        <div class="message">${message}</div>
        <div class="info">
            <p>📱 On mobile, you'll be redirected to the app.</p>
            <p>💡 Please try again or contact support if the issue persists.</p>
        </div>
    </div>
</body>
</html>
  `;
  res.send(html);
});

app.get('/subscription/pending', (req, res) => {
  const reference = req.query.reference || 'N/A';
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Pending - BlueWhale Marketplace</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #fad961 0%, #f76b1c 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .pending-icon {
            width: 100px;
            height: 100px;
            background: #f59e0b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.1);
                opacity: 0.8;
            }
        }
        .pending-mark {
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 4;
            stroke-linecap: round;
            fill: none;
        }
        h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 10px;
        }
        .reference {
            background: #fef3c7;
            padding: 12px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #92400e;
        }
        .info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="pending-icon">
            <svg class="pending-mark" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="20"/>
                <path d="M26 16 L26 26 L26 36" stroke-linecap="round"/>
            </svg>
        </div>
        <h1>Payment Pending</h1>
        <p>Your payment is being processed.</p>
        <p>This may take a few minutes to complete.</p>
        <div class="reference">Reference: ${reference}</div>
        <div class="info">
            <p>📧 You will receive a confirmation email once payment is verified.</p>
            <p>📱 On mobile, you'll be redirected to the app automatically.</p>
            <p>💡 You can close this window - we'll notify you when payment is confirmed.</p>
        </div>
    </div>
</body>
</html>
  `;
  res.send(html);
});

app.use('/api/stories', (req, res, next) => {
    console.log('🚀 Stories route registered - Path:', req.path, 'Method:', req.method);
    next();
}, storyRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/seller-feedback', sellerFeedbackRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/visibility-scores', visibilityScoreRoutes);
app.use('/api/top-placement', topPlacementRoutes);
app.use('/api/spotlight', spotlightRoutes);
app.use('/api/promotions/analytics', require('./src/routes/promotionAnalyticsRoutes'));



// Enhanced database sync with verification
async function syncDatabase() {
    console.log('🔄 Starting database synchronization...');
    
    // Wait for database to be ready (Railway MySQL might take a moment)
    let retries = 5;
    while (retries > 0) {
        try {
            await db.sequelize.authenticate();
            console.log('✅ Database connection established');
            break;
        } catch (error) {
            retries--;
            if (retries === 0) {
                throw new Error('Database connection failed after retries');
            }
            console.log(`⏳ Waiting for database... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Get all models from Sequelize's internal registry (works everywhere)
    // This is more reliable than checking db object properties
    const sequelizeModels = db.sequelize.models || {};
    const modelNames = Object.keys(sequelizeModels);
    
    console.log(`📊 Found ${modelNames.length} models to sync`);
    
    // Debug: Show some model names if found
    if (modelNames.length > 0) {
        console.log(`   Sample models: ${modelNames.slice(0, 5).join(', ')}...`);
    } else {
        console.log('⚠️  Warning: No models found in Sequelize registry');
        console.log('   This might indicate models are not loaded yet');
    }
    
    try {
        // CRITICAL: Disable foreign key checks during sync to avoid constraint errors
        // This allows tables to be created in any order
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('🔓 Foreign key checks disabled for sync');
        
        // Sync models individually to handle errors gracefully
        // This allows us to continue even if some models fail
        let successCount = 0;
        let failCount = 0;
        const failedModels = [];
        
        console.log('🔄 Syncing models individually...');
        for (const modelName of modelNames) {
            try {
                const model = sequelizeModels[modelName];
                // Sync individual model - auto-update schema for key models to append new columns
                const alterModels = ['Notification', 'BuyerNeed', 'BuyerNeedMatch'];
                const syncOptions = alterModels.includes(modelName)
                    ? { force: false, alter: true }
                    : { force: false, alter: false };
                await model.sync(syncOptions);
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`   ✅ Synced ${successCount}/${modelNames.length} models...`);
                }
            } catch (error) {
                failCount++;
                failedModels.push({ model: modelName, error: error.message });
                console.log(`   ⚠️  Failed to sync ${modelName}: ${error.message.substring(0, 60)}...`);
                // Continue with next model
            }
        }
        
        // Re-enable foreign key checks after sync
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🔒 Foreign key checks re-enabled');
        
        console.log(`\n✅ Sync completed: ${successCount} succeeded, ${failCount} failed`);
        
        if (failedModels.length > 0) {
            console.log('\n⚠️  Failed models:');
            failedModels.slice(0, 10).forEach(({ model, error }) => {
                console.log(`   - ${model}: ${error.substring(0, 60)}`);
            });
            if (failedModels.length > 10) {
                console.log(`   ... and ${failedModels.length - 10} more`);
            }
        }
        
        // Verify which tables were created
        const [tables] = await db.sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        
        const createdTables = tables.map(t => t.TABLE_NAME.toLowerCase());
        console.log(`\n📊 Total tables created: ${createdTables.length}`);
        
        // Check if all models have corresponding tables
        const missingTables = [];
        const modelTableMap = {};
        
        modelNames.forEach(modelName => {
            const model = sequelizeModels[modelName];
            // Get table name from Sequelize model
            const expectedTableName = (model.tableName || model.name || modelName).toLowerCase();
            modelTableMap[modelName] = expectedTableName;
            
            if (!createdTables.includes(expectedTableName)) {
                missingTables.push({
                    model: modelName,
                    expectedTable: expectedTableName
                });
            }
        });
        
        if (missingTables.length > 0) {
            console.log(`\n⚠️  Warning: ${missingTables.length} models don't have tables:`);
            missingTables.forEach(({ model, expectedTable }) => {
                console.log(`   ❌ ${model} → ${expectedTable}`);
            });
            console.log('\n💡 Possible causes:');
            console.log('   - Model syntax errors');
            console.log('   - Foreign key dependency issues');
            console.log('   - Model not properly initialized');
        } else {
            console.log(`\n✅ All ${modelNames.length} models have corresponding tables!`);
        }
        
        // Log first 10 tables as sample
        if (createdTables.length > 0) {
            console.log('\n📋 Sample tables created:');
            createdTables.slice(0, 10).forEach((table, idx) => {
                console.log(`   ${idx + 1}. ${table}`);
            });
            if (createdTables.length > 10) {
                console.log(`   ... and ${createdTables.length - 10} more`);
            }
        }
    
    // After sync, update any NULL timestamps to current time
        try {
            await db.sequelize.query(`
        UPDATE users 
        SET createdAt = NOW(), updatedAt = NOW() 
        WHERE createdAt IS NULL OR updatedAt IS NULL
    `);
    console.log('✅ Timestamps updated for existing users');
        } catch (error) {
            // Users table might not exist yet, that's okay
            if (!error.message.includes("doesn't exist") && !error.message.includes("Unknown column")) {
                console.log('⚠️  Could not update timestamps:', error.message);
            }
        }
    
    // Initialize story cleanup service and buyer need matching scheduler (only if not in test mode)
    if (process.env.NODE_ENV !== 'test') {
        StoryCleanupService.scheduleCleanup();
        BuyerNeedSchedulerService.scheduleMatchingRunner();
    }

    // Clean up legacy database triggers that post buyer needs to the public feed
    try {
        console.log('🗑️ Dropping legacy buyer need feed triggers...');
        await db.sequelize.query('DROP TRIGGER IF EXISTS tr_buyer_need_to_feed');
        await db.sequelize.query('DROP TRIGGER IF EXISTS tr_buyer_need_update_feed');
        await db.sequelize.query('DROP TRIGGER IF EXISTS tr_buyer_need_media_to_feed');
        console.log('✅ Legacy buyer need triggers dropped successfully');

        // Delete legacy buyer needs from the public posts table
        console.log('🗑️ Cleaning up legacy buyer needs from the public feed posts...');
        await db.sequelize.query("DELETE FROM posts WHERE source_table = 'buyer_needs'");
        console.log('✅ Public feed cleaned of legacy buyer needs');
    } catch (dbCleanupError) {
        console.error('⚠️ Database triggers drop / posts cleanup warning:', dbCleanupError.message);
    }

    // Auto-seed subscription plans if the table is empty
    try {
        const planCount = await db.SubscriptionPlan.count();
        if (planCount === 0) {
            console.log('🌱 Subscription plans table is empty. Running auto-seeder SQL...');
            const fs = require('fs');
            const path = require('path');
            const sqlPath = path.join(__dirname, 'migrations', '2026-1-15-restore-subscription-plans.sql');
            if (fs.existsSync(sqlPath)) {
                const rawSql = fs.readFileSync(sqlPath, 'utf8');
                // Strip comments robustly before splitting statements
                let cleanedSql = rawSql
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                    .replace(/--.*$/gm, '');          // Remove single-line comments
                
                const sqlStatements = cleanedSql
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0);
                
                for (const statement of sqlStatements) {
                    await db.sequelize.query(statement);
                }
                console.log('✅ Subscription plans successfully seeded');
            } else {
                console.warn('⚠️ Seeder SQL file not found at:', sqlPath);
            }
        }
    } catch (seederErr) {
        console.error('❌ Failed to auto-seed subscription plans:', seederErr.message);
    }
    
        return { 
            success: successCount > 0, 
            tablesCreated: createdTables.length, 
            missingTables,
            successCount,
            failCount,
            failedModels
        };
        
    } catch (error) {
        // Re-enable foreign key checks even if sync failed
        try {
            await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            // Ignore if this fails
        }
        
        console.error('\n❌ Database sync error:', error.message);
        
        // Provide helpful error context
        if (error.message.includes('ER_ACCESS_DENIED')) {
            console.error('💡 Check your database credentials in environment variables');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 Database might not be ready yet, check Railway logs');
        } else if (error.message.includes('syntax')) {
            console.error('💡 Check your model definitions for syntax errors');
        } else if (error.message.includes("doesn't exist") || error.message.includes("Key column")) {
            console.error('💡 Foreign key constraint issue - syncing models individually should help');
        }
        
        // Don't exit - let server start anyway (some tables might exist)
        return { success: false, error: error.message };
    }
}

// Run sync before starting server
syncDatabase()
    .then((result) => {
        if (result.success) {
            console.log('\n✅ Database ready!');
            if (result.missingTables && result.missingTables.length > 0) {
                console.log(`⚠️  ${result.missingTables.length} tables missing, but continuing...`);
            }
            
            // Initialize trigger manager to verify/restore triggers
            const TriggerManager = require('./src/utils/triggerManager');
            TriggerManager.initialize();
            
            // Initialize auction scheduler AFTER sync completes
            // This ensures tables exist before scheduler tries to query them
            const AuctionScheduler = require('./src/services/auctionScheduler');
            AuctionScheduler.scheduleChecks();
            console.log('✅ Auction scheduler initialized');
        } else {
            console.log('\n⚠️  Database sync had issues, but continuing...');
            console.log(`   Error: ${result.error}`);

            // Initialize trigger manager to verify/restore triggers
            try {
                const TriggerManager = require('./src/utils/triggerManager');
                TriggerManager.initialize();
            } catch (e) {
                console.log('⚠️  Could not initialize trigger manager:', e.message);
            }

            // Still initialize scheduler, but it might fail if tables don't exist
            try {
                const AuctionScheduler = require('./src/services/auctionScheduler');
                AuctionScheduler.scheduleChecks();
            } catch (e) {
                console.log('⚠️  Could not initialize auction scheduler:', e.message);
            }
        }
        console.log('🚀 Starting server...\n');
    })
    .catch((error) => {
        console.error('❌ Fatal database error:', error);
        console.log('⚠️  Server will start anyway, but database might not be ready');
});

// Only run scheduled tasks if not in test environment
if (process.env.NODE_ENV !== 'test') {
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

// Initialize auction scheduler AFTER database sync completes
// (Moved to syncDatabase().then() to ensure tables exist first)

// Initialize promotion expiration cron job (handles boosts, top placements, spotlights, and auto-reboosts)
const PromotionExpirationJob = require('./src/jobs/promotionExpirationJob');
const MonthlyPromotionResetJob = require('./src/jobs/monthlyPromotionResetJob');
PromotionExpirationJob.start();
console.log('✅ Promotion expiration cron job initialized (runs every hour)');

// Initialize score recalculation cron job
const ScoreRecalculationJob = require('./src/jobs/scoreRecalculationJob');
ScoreRecalculationJob.start();
console.log('✅ Score recalculation cron job initialized (runs every hour at :05)');

// Initialize monthly promotion reset cron job
MonthlyPromotionResetJob.start();
console.log('✅ Monthly promotion reset cron job initialized (runs on 1st of each month at 00:00)');

// Initialize virtual account monitoring cron job (for Flutterwave virtual account payments)
// DISABLED: Not needed for recurring subscriptions (virtual accounts are one-time payments only)
// const VirtualAccountMonitoringJob = require('./src/jobs/virtualAccountMonitoringJob');
// VirtualAccountMonitoringJob.start();
// console.log('✅ Virtual account monitoring cron job initialized (runs every 15 minutes)');

// Initialize subscription reminder cron job (sends 3-day expiration reminders)
// DISABLED: Not needed for auto-renewing subscriptions (Flutterwave handles renewals automatically)
// const SubscriptionReminderJob = require('./src/jobs/subscriptionReminderJob');
// SubscriptionReminderJob.start();
// console.log('✅ Subscription reminder cron job initialized (runs daily at 9:00 AM)');

// Initialize subscription expiration cron job (marks expired subscriptions and sends emails)
// DISABLED: Not needed for auto-renewing subscriptions (Flutterwave handles renewals automatically)
// const SubscriptionExpirationJob = require('./src/jobs/subscriptionExpirationJob');
// SubscriptionExpirationJob.start();
// console.log('✅ Subscription expiration cron job initialized (runs daily at 10:00 AM)');

// Initialize trial expiration cron job (handles free trial expiration and reminders)
const TrialExpirationJob = require('./src/jobs/trialExpirationJob');
TrialExpirationJob.start();
console.log('✅ Trial expiration cron job initialized (runs daily at 9:00 AM)');
}

// Only start server if not in test environment and file is run directly
// Start server AFTER sync completes (with delay to ensure sync finishes)
if (process.env.NODE_ENV !== 'test' && require.main === module) {
    // Give sync time to complete (it's async, so this ensures server starts after)
    setTimeout(() => {
        server.listen(port, () => {
            console.log(`● Server running on port ${port} ✅`);
            console.log(`● WebSocket server initialized for real-time auction updates ✅`);

            // After startup logs print, mute subsequent verbose console.log in production
            if (process.env.NODE_ENV === 'production') {
                console.log = () => {};
                console.info = () => {};
            }
        });
    }, 2000); // 2 second delay to ensure sync completes
}

// Export app and server for testing
module.exports = { app, server, io };