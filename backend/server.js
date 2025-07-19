const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set in environment variables');
      return false;
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    });
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return false;
  }
};

// Connect to MongoDB
connectDB();

// Example route
app.get('/', (req, res) => {
  res.send('Engineering Office Backend Running');
});

// Simple test route to verify server is working
app.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is responding', 
    timestamp: new Date(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
    },
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test route to check if server is working
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Server is working' });
});

// Simple test route without database
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working', timestamp: new Date() });
});

// Simple test route for projects without database
app.get('/api/projects-test', (req, res) => {
  res.json({ success: true, data: [], message: 'Projects test route is working' });
});

// Simple test routes directly in server.js
app.get('/api/projects-simple', (req, res) => {
  res.json({ success: true, data: [], message: 'Projects simple route is working' });
});

app.get('/api/tasks-simple', (req, res) => {
  res.json({ success: true, data: [], message: 'Tasks simple route is working' });
});

app.get('/api/clients-simple', (req, res) => {
  res.json({ success: true, data: [], message: 'Clients simple route is working' });
});

app.get('/api/users-simple', (req, res) => {
  res.json({ success: true, data: [], message: 'Users simple route is working' });
});

// Add routes with error handling
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/users', require('./routes/users'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  console.log(`JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
}); 