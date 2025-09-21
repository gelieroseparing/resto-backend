const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const verifyToken = require('../middleware/auth'); // This will work after fixing middleware export

const router = express.Router();

// Multer setup for profile image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { username, password, position } = req.body;

    if (!username || !password || !position) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, position });
    res.json({ message: 'User created successfully', user: { id: user._id, username, position } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        position: user.position,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        position: user.position,
        profileImage: user.profileImage || '/profile.jpg'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// UPDATE PROFILE
router.put('/profile', verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId); // Fixed: req.user.userId
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.username) {
      user.username = req.body.username;
    }

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      user: {
        username: user.username,
        position: user.position,
        profileImage: user.profileImage || '/profile.jpg'
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

module.exports = router;