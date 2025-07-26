const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./logger');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://theofficemanagemet.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3006'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Cache-Control',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

// Add preflight handling for all routes
app.options('*', cors());

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Enhanced MongoDB connection with retry logic
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    console.log('🔍 Checking MongoDB URI...');
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      MONGODB_URI: mongoURI ? 'EXISTS' : 'NOT FOUND',
      JWT_SECRET: process.env.JWT_SECRET ? 'EXISTS' : 'NOT FOUND',
      CORS_ORIGIN: process.env.CORS_ORIGIN
    });
    
    if (!mongoURI) {
      logger.warn('⚠️ MONGODB_URI not found, using fallback', undefined, 'DATABASE');
      console.log('❌ MONGODB_URI is missing!');
      // Don't exit, just log warning
      return;
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });

    logger.info('✅ MongoDB connected successfully', undefined, 'DATABASE');
    console.log('✅ MongoDB connected successfully!');
    
    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error', { error: err.message }, 'DATABASE');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected', undefined, 'DATABASE');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected', undefined, 'DATABASE');
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed', { error: error.message }, 'DATABASE');
    // Don't exit, just log error
  }
};

// Connect to MongoDB
connectDB();

// Example route
app.get('/', (req, res) => {
  res.json({
    message: 'Engineering Office Backend Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/users', require('./routes/users'));
app.use('/api/realtime', require('./routes/realtime'));

// New routes
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/upcomingPayments', require('./routes/upcomingPayments'));
app.use('/api/companySettings', require('./routes/companySettings'));
app.use('/api/userSettings', require('./routes/userSettings'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/taskTypes', require('./routes/taskTypes'));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', undefined, 'SERVER');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed', undefined, 'SERVER');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully', undefined, 'SERVER');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed', undefined, 'SERVER');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

app.listen(port, () => {
  logger.info(`🚀 Server running on port ${port}`, { port, environment: process.env.NODE_ENV || 'development' }, 'SERVER');
  logger.info(`🔗 Health check: http://localhost:${port}/health`, undefined, 'SERVER');
}); 