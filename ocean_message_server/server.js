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

// Health check endpoint (monitoring / browser)
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    service: 'BlueWhale Message Server',
    message: 'BlueWhale Message Server is running',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage()
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
      max-width: 960px;
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
    .grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
          <span class="title-pill">Messaging & Realtime</span>
        </h1>
        <p class="subtitle">
          Status and runtime metrics for the messaging and conversations service.
        </p>
      </div>
      <div>
        <div class="status-badge">
          <span class="status-dot"></span>
          <span>Healthy</span>
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
        <p class="metric-sub">${health.message}</p>
        <div class="key-value">
          <span>HTTP API</span>
          <span>Online</span>
        </div>
        <div class="key-value">
          <span>WebSocket</span>
          <span>Listening on port ${PORT}</span>
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

function startServer() {
  server.listen(PORT, () => {
    console.log(`🚀 BlueWhale Message Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for connections`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
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