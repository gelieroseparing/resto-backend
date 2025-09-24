require('dotenv').config(); // Load .env variables
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

// Routes
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------- MIDDLEWARE ----------------------
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------- ROUTES ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);

// ---------------------- DEFAULT ROUTE ----------------------
app.get('/', (req, res) => {
  res.send('Resto POS Backend is running');
});

// ---------------------- ERROR HANDLER ----------------------
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ---------------------- CONNECT TO MONGODB ----------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
