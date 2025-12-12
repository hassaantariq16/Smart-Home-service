const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Database connections
const { connectMongoDB } = require('./config/mongodb');
const { connectRedis } = require('./config/redis');
const { connectCassandra } = require('./config/cassandra');
const { connectNeo4j } = require('./config/neo4j');
const { connectElasticsearch } = require('./config/elasticsearch');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const deviceRoutes = require('./routes/devices');
const serviceRoutes = require('./routes/services');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Make io accessible to routes
app.set('io', io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Smart Services Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.IO real-time connections
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('subscribe:device', (deviceId) => {
    socket.join(`device:${deviceId}`);
    console.log(`📡 Client ${socket.id} subscribed to device:${deviceId}`);
  });

  socket.on('unsubscribe:device', (deviceId) => {
    socket.leave(`device:${deviceId}`);
    console.log(`📴 Client ${socket.id} unsubscribed from device:${deviceId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Initialize databases and start server
async function startServer() {
  try {
    console.log('🚀 Starting Smart Services Platform...\n');

    // Connect to all databases
    await connectMongoDB();
    await connectRedis();
    await connectCassandra();
    await connectNeo4j();
    await connectElasticsearch();

    console.log('\n✅ All databases connected successfully!\n');

    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log(`🎉 Server running on http://localhost:${PORT}`);
      console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log('═══════════════════════════════════════════════════════\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, io };
