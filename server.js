const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

/* ------------------------------- Middleware ------------------------------- */
// CORS configuration - allow your frontend to access the API
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // ✅ Adjust to deployed frontend URL
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images (e.g., profile pictures)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ------------------------------ MongoDB Setup ----------------------------- */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

/* --------------------------------- Routes -------------------------------- */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Health check / root route
app.get("/", (req, res) => {
  res.send("🍽️ POS and Inventory Management API is running 🚀");
});

/* -------------------------- Error Handling Setup ------------------------- */
// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle 404 - route not found
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

/* ------------------------------- Start Server ---------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
