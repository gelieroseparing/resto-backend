// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/* ---------------------- Multer setup for profile images ---------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ----------------------------- USER SIGNUP ----------------------------- */
router.post('/signup', async (req, res) => {
  try {
    const { username, password, position } = req.body;

    if (!username || !password || !position) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({
        message: 'Username must be at least 3 characters and password at least 6 characters',
      });
    }

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, position });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, username: user.username, position: user.position },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

/* ------------------------------ USER LOGIN ------------------------------ */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, username: user.username, position: user.position },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        position: user.position,
        profileImage: user.profileImage || '/uploads/profile.jpg',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/* ----------------------------- GET PROFILE ----------------------------- */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        position: user.position,
        profileImage: user.profileImage || '/uploads/profile.jpg',
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

/* ---------------------------- GET ALL USERS (Admin only) ---------------------------- */
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

module.exports = router;
