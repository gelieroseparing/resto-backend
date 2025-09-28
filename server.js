require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Import routes
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://resto-frontend-4bw1.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DEBUG: Detailed route loading check
console.log('=== DETAILED ROUTE DEBUG ===');
console.log('1. categoryRoutes:', categoryRoutes ? 'LOADED' : 'FAILED', typeof categoryRoutes);
console.log('2. authRoutes:', authRoutes ? 'LOADED' : 'FAILED', typeof authRoutes);
console.log('3. itemRoutes:', itemRoutes ? 'LOADED' : 'FAILED', typeof itemRoutes);
console.log('4. orderRoutes:', orderRoutes ? 'LOADED' : 'FAILED', typeof orderRoutes);

// Check if they are Express routers
if (authRoutes && authRoutes.stack) {
  console.log('✅ authRoutes is an Express router with', authRoutes.stack.length, 'routes');
} else {
  console.log('❌ authRoutes is NOT an Express router');
}

if (itemRoutes && itemRoutes.stack) {
  console.log('✅ itemRoutes is an Express router with', itemRoutes.stack.length, 'routes');
} else {
  console.log('❌ itemRoutes is NOT an Express router');
}

if (orderRoutes && orderRoutes.stack) {
  console.log('✅ orderRoutes is an Express router with', orderRoutes.stack.length, 'routes');
} else {
  console.log('❌ orderRoutes is NOT an Express router');
}
console.log('============================');

// Routes (without /api prefix)
app.use('/category', categoryRoutes);
app.use('/auth', authRoutes);
app.use('/items', itemRoutes);
app.use('/orders', orderRoutes);

// Health check route (without /api prefix)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Public items endpoint (no authentication required) - without /api prefix
app.get('/public/items', async (req, res) => {
  try {
    const Item = require('./models/Item');
    const items = await Item.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching public items:', err);
    res.status(500).json({ message: 'Error fetching items' });
  }
});

// Individual route tests
app.get('/test-category', (req, res) => res.json({ message: 'Category routes mounted' }));
app.get('/test-auth', (req, res) => res.json({ message: 'Auth routes mounted' }));
app.get('/test-items', (req, res) => res.json({ message: 'Items routes mounted' }));
app.get('/test-orders', (req, res) => res.json({ message: 'Orders routes mounted' }));

// Test auth route
app.get('/test-auth-route', (req, res) => {
  res.json({ 
    message: 'Auth routes test',
    authRoutes: ['POST /auth/signup', 'POST /auth/login', 'GET /auth/profile']
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('Resto POS Backend is running');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Enhanced MongoDB connection with better error handling
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    process.exit(1);
  }
};

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log('Routes configured without /api prefix');
  });
});