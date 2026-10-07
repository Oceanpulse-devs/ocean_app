require('./instrumentation');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import database and middleware
const { testConnection } = require('./config/database');
const db = require('./models');
const authMiddleware = require('./src/middleware/authMiddleware');
const socketAuthMiddleware = require('./src/middleware/socketAuthMiddleware');

// Import routes
const messageRoutes = require('./src/routes/messageRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Import socket handlers
const socketHandler = require('./src/socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true, // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  pingTimeout: parseInt(process.env.WS_HEARTBEAT_TIMEOUT) || 5000,
  pingInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 25000
});

const PORT = process.env.PORT || 5001;

// Trust proxy for Railway deployment - only trust the first proxy
app.set('trust proxy', 1);

// Share io with Express app routes/controllers
app.set('io', io);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - Allow all origins
app.use(cors({
  origin: true, // Allow all origins for development and production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Main Server link check cache (20s TTL to prevent healthcheck latency and recursive loops)
let mainServerCheckCache = {
  status: 'unknown',
  target: null,
  latencyMs: null,
  lastChecked: null,
  _timestamp: 0,
  error: null
};

async function getMainServerHealth(skipFetch = false) {
  let mainUrl = process.env.MAIN_SERVER_URL;
  if (!mainUrl) {
    return {
      status: 'not_configured',
      target: null,
      latencyMs: null,
      lastChecked: new Date().toISOString()
    };
  }

  mainUrl = mainUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(mainUrl)) {
    mainUrl = `https://${mainUrl}`;
  }

  const now = Date.now();
  if (skipFetch || (mainServerCheckCache.lastChecked && (now - mainServerCheckCache._timestamp < 20000))) {
    return {
      status: mainServerCheckCache.status,
      target: mainUrl,
      latencyMs: mainServerCheckCache.latencyMs,
      lastChecked: mainServerCheckCache.lastChecked || new Date().toISOString(),
      ...(mainServerCheckCache.error ? { error: mainServerCheckCache.error } : {})
    };
  }

  const axios = require('axios');
  const startTime = Date.now();
  try {
    const response = await axios.get(`${mainUrl}/health`, {
      timeout: 2500,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BlueWhale-HealthCheck/1.0',
        'X-Internal-Health-Ping': 'true'
      }
    });
    const latencyMs = Date.now() - startTime;
    mainServerCheckCache = {
      status: response.status === 200 ? 'connected' : 'degraded',
      target: mainUrl,
      latencyMs,
      lastChecked: new Date().toISOString(),
      _timestamp: now,
      error: null
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    mainServerCheckCache = {
      status: 'disconnected',
      target: mainUrl,
      latencyMs,
      lastChecked: new Date().toISOString(),
      _timestamp: now,
      error: err.code === 'ECONNABORTED' ? 'Timeout (2.5s)' : (err.message || 'Connection failed')
    };
  }

  return {
    status: mainServerCheckCache.status,
    target: mainUrl,
    latencyMs: mainServerCheckCache.latencyMs,
    lastChecked: mainServerCheckCache.lastChecked,
    ...(mainServerCheckCache.error ? { error: mainServerCheckCache.error } : {})
  };
}

// Health check endpoint (monitoring / browser / VPS)
app.get(['/health', '/api/health'], async (req, res) => {
  const isInternalPing = req.headers['x-internal-health-ping'] === 'true';

  const baseHealth = {
    status: 'OK',
    service: 'BlueWhale Message Server',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || 'v1',
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
    const redisClient = require('./src/config/redis');
    if (redisClient && typeof redisClient.ping === 'function') {
      const pong = await redisClient.ping();
      redisStatus.status = (pong === 'PONG' || pong === true) ? 'up' : 'degraded';
    } else if (redisClient && redisClient.isReady) {
      redisStatus.status = 'up';
    } else {
      redisStatus.status = 'not_configured';
    }
  } catch (err) {
    redisStatus.status = 'down';
    redisStatus.error = err.message || String(err);
    baseHealth.status = 'DEGRADED';
  }

  // Main Server link health (cached 20s)
  const mainLinkStatus = await getMainServerHealth(isInternalPing);

  // Active Storage Provider (safe public info)
  const rawStorage = (process.env.STORAGE_PROVIDER || 'cloudinary').trim().toLowerCase();
  const isR2 = rawStorage === 'r2' || rawStorage === 'rs';
  const storageStatus = {
    provider: isR2 ? 'cloudflare_r2' : 'cloudinary',
    status: 'configured',
    maxUploadMb: 10
  };

  const health = {
    ...baseHealth,
    services: {
      database: dbStatus,
      redis: redisStatus,
      mainServerLink: mainLinkStatus,
      storage: storageStatus
    },
    db: dbStatus,
    redis: redisStatus
  };

  const wantsHtml =
    req.query.format === 'html' ||
    (req.headers.accept && req.headers.accept.includes('text/html'));

  // Default JSON response for monitors / scripts
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
    if (status === 'up' || status === 'connected' || status === 'configured') {
      return { text: status === 'connected' ? 'Connected' : (status === 'configured' ? 'Configured' : 'Up'), color: '#22c55e', cssClass: 'status-up' };
    }
    if (status === 'down' || status === 'disconnected') {
      return { text: status === 'disconnected' ? 'Disconnected' : 'Down', color: '#ef4444', cssClass: 'status-down' };
    }
    if (status === 'degraded') {
      return { text: 'Degraded', color: '#eab308', cssClass: 'status-degraded' };
    }
    return { text: 'Not Configured', color: '#9ca3af', cssClass: 'status-unknown' };
  };

  const statusBadge = getStatusBadge(health.status);
  const dbStatusDisplay = getStatusDisplay(health.services.database.status);
  const redisStatusDisplay = getStatusDisplay(health.services.redis.status);
  const mainLinkDisplay = getStatusDisplay(health.services.mainServerLink.status);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BlueWhale Message Server Health</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #020617;
      --bg-card: #0b1020;
      --accent: #22c55e;
      --accent-soft: rgba(34, 197, 94, 0.1);
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
      background: radial-gradient(circle at top, #020617 0, #020617 55%, #000 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: stretch;
      justify-content: center;
      padding: 24px;
    }
    .container {
      width: 100%;
      max-width: 1080px;
      background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(2,6,23,0.96));
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
        radial-gradient(circle at 0 0, rgba(34,197,94,0.35), transparent 55%),
        radial-gradient(circle at 100% 100%, rgba(59,130,246,0.25), transparent 55%);
      opacity: 0.25;
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
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      position: relative;
      z-index: 1;
    }
    .card {
      background: rgba(15,23,42,0.9);
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
      background: radial-gradient(circle at top left, rgba(34,197,94,0.14), transparent 55%);
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
      max-width: 60%;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      color: #38bdf8;
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
      box-shadow: 0 0 10px rgba(34,197,94,0.9);
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
          BlueWhale Message Server Health
          <span class="title-pill">Realtime Engine</span>
        </h1>
        <p class="subtitle">
          Status, infrastructure checks, and cross-server connectivity diagnostics for realtime chat.
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
          <span class="card-badge">Messaging</span>
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
          <h2 class="card-title">Runtime & Process</h2>
          <span class="card-badge">Process</span>
        </div>
        <p class="metric-main">${uptimeHours}h ${uptimeMinutes % 60}m</p>
        <p class="metric-sub">${uptimeSeconds}s total uptime</p>
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
          <h2 class="card-title">Infrastructure</h2>
          <span class="card-badge">Data Layer</span>
        </div>
        <p class="metric-main">${health.status === 'OK' ? 'Healthy' : 'Degraded'}</p>
        <p class="metric-sub">Database, Cache & WebSockets</p>
        <div class="key-value">
          <span>WebSocket</span>
          <span class="status-indicator status-up">
            <span class="status-indicator-dot" style="background: #22c55e;"></span>
            <span>Port ${PORT}</span>
          </span>
        </div>
        <div class="key-value">
          <span>MySQL DB</span>
          <span class="status-indicator ${dbStatusDisplay.cssClass}">
            <span class="status-indicator-dot" style="background: ${dbStatusDisplay.color};"></span>
            <span>${dbStatusDisplay.text} ${health.services.database.error ? `(${health.services.database.error})` : ''}</span>
          </span>
        </div>
        <div class="key-value">
          <span>Redis Cache</span>
          <span class="status-indicator ${redisStatusDisplay.cssClass}">
            <span class="status-indicator-dot" style="background: ${redisStatusDisplay.color};"></span>
            <span>${redisStatusDisplay.text} ${health.services.redis.error ? `(${health.services.redis.error})` : ''}</span>
          </span>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <h2 class="card-title">Main Server Link</h2>
          <span class="card-badge">Interconnect</span>
        </div>
        <p class="metric-main">${mainLinkDisplay.text}</p>
        <p class="metric-sub">${health.services.mainServerLink.latencyMs !== null ? `${health.services.mainServerLink.latencyMs}ms latency` : 'Cross-link inactive'}</p>
        <div class="key-value">
          <span>Status</span>
          <span class="status-indicator ${mainLinkDisplay.cssClass}">
            <span class="status-indicator-dot" style="background: ${mainLinkDisplay.color};"></span>
            <span>${mainLinkDisplay.text}</span>
          </span>
        </div>
        <div class="key-value">
          <span>Target</span>
          <span title="${health.services.mainServerLink.target || 'None'}">${health.services.mainServerLink.target || 'None'}</span>
        </div>
        <div class="key-value">
          <span>Last Synced</span>
          <span>${health.services.mainServerLink.lastChecked ? health.services.mainServerLink.lastChecked.substring(11, 19) + ' UTC' : 'Never'}</span>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <h2 class="card-title">Media Storage</h2>
          <span class="card-badge">Storage</span>
        </div>
        <p class="metric-main">${health.services.storage.provider === 'cloudflare_r2' ? 'Cloudflare R2' : 'Cloudinary'}</p>
        <p class="metric-sub">Max upload: ${health.services.storage.maxUploadMb} MB</p>
        <div class="key-value">
          <span>Engine</span>
          <span>${health.services.storage.provider}</span>
        </div>
        <div class="key-value">
          <span>Status</span>
          <span class="status-indicator status-up">
            <span class="status-indicator-dot" style="background: #22c55e;"></span>
            <span>Configured</span>
          </span>
        </div>
        <div class="key-value">
          <span>Type</span>
          <span>${health.services.storage.provider === 'cloudflare_r2' ? 'S3 Object Storage' : 'Cloud CDN Store'}</span>
        </div>
      </article>
    </section>

    <footer class="footer">
      <div class="pill">
        <span class="pill-dot"></span>
        <span>Tip: Add <code>?format=html</code> to always view this dashboard.</span>
      </div>
      <a href="/api/messages" target="_blank" rel="noreferrer">
        View messages API →
      </a>
    </footer>
  </main>
</body>
</html>`;

  res.status(200).send(html);
});

// Handle CORS preflight for all API routes
app.options('*', cors());

// API routes
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);

// Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.userId}`);
  
  // Join user's personal room
  socket.join(`user:${socket.userId}`);
  
  // Handle socket events
  socketHandler(io, socket);
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.userId}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Database connection and server start
// Messaging server connects to existing tables (created by main server)
testConnection()
  .then(() => {
    console.log('✅ Database connected successfully');
    startServer();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

async function verifyMainServerConnectivity() {
  const axios = require('axios');
  let mainUrl = process.env.MAIN_SERVER_URL;
  if (!mainUrl) {
    console.log('ℹ️ MAIN_SERVER_URL is not set (skipping cross-server connectivity check)');
    mainServerCheckCache = {
      status: 'not_configured',
      target: null,
      latencyMs: null,
      lastChecked: new Date().toISOString(),
      _timestamp: Date.now(),
      error: null
    };
    return;
  }

  mainUrl = mainUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(mainUrl)) {
    mainUrl = `https://${mainUrl}`;
  }

  console.log(`🔍 Checking connectivity to Main Server at ${mainUrl}...`);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${mainUrl}/health`, {
        timeout: 4000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BlueWhale-BootCheck/1.0',
          'X-Internal-Health-Ping': 'true'
        }
      });
      const latencyMs = Date.now() - startTime;
      if (response.status === 200) {
        console.log(`● Main Server connection verified ✅ (${mainUrl} - ${latencyMs}ms)`);
        mainServerCheckCache = {
          status: 'connected',
          target: mainUrl,
          latencyMs,
          lastChecked: new Date().toISOString(),
          _timestamp: Date.now(),
          error: null
        };
        return;
      }
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.warn(`⚠️ Cross-Server Warning: Cannot reach Main Server at ${mainUrl}`);
      console.warn(`   Error: ${err.message}`);
      console.warn(`💡 Check MAIN_SERVER_URL in your environment variables.`);
      mainServerCheckCache = {
        status: 'disconnected',
        target: mainUrl,
        latencyMs,
        lastChecked: new Date().toISOString(),
        _timestamp: Date.now(),
        error: err.code === 'ECONNABORTED' ? 'Timeout (4s)' : (err.message || 'Connection failed')
      };
    }
  }
}

function startServer() {
  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 BlueWhale Message Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for connections`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);

    // Verify connectivity to Main Server
    await verifyMainServerConnectivity();

    // After startup logs print, mute subsequent verbose console.log in production
    if (process.env.NODE_ENV === 'production') {
      console.log = () => {};
      console.info = () => {};
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server, io }; 