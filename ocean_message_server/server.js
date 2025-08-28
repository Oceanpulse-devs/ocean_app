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
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: process.env.WS_HEARTBEAT_TIMEOUT || 5000,
  pingInterval: process.env.WS_HEARTBEAT_INTERVAL || 25000
});

const PORT = process.env.PORT || 5001;

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

// CORS configuration
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Ocean Message Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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
    console.log(`🚀 Ocean Message Server running on port ${PORT}`);
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