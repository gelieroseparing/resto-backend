require('dotenv').config(); // Load env variables
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors'); // <-- Add this line

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // now cors is defined
app.use(express.json()); // parse JSON
app.use(express.urlencoded({ extended: true })); // parse URL-encoded

// Serve static files (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Resto POS Backend is running');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Connect to MongoDB
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