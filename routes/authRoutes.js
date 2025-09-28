const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/* ---------------------- Multer setup for profile images ---------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + Math.random().toString(36).substring(2, 8) + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ---------------------- Signup (positions: chief, staff, cashier) ---------------------- */
router.post('/signup', async (req, res) => {
  try {
    const { username, password, position } = req.body;

    // Validate fields and positions (match frontend: chief, staff, cashier)
    if (!username || !password || !position) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ message: 'Username must be at least 3 chars, password at least 6' });
    }
    if (!['chief', 'staff', 'cashier'].includes(position)) {
      return res.status(400).json({ message: 'Invalid position: must be chief, staff, or cashier' });
    }

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, position });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, username: user.username, position: user.position, profileImage: user.profileImage },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup', error: err.message });
  }
});

/* ---------------------- Login ---------------------- */
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
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

/* ---------------------- Get Profile ---------------------- */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error while fetching profile', error: err.message });
  }
});

/* ---------------------- Update Profile (with image upload) ---------------------- */
router.put('/profile', verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username) return res.status(400).json({ message: 'Username is required' });

    const updateData = { username };

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Profile update error:', err);
    if (err.message.includes('Only image files')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

/* ---------------------- Change Password ---------------------- */
router.put('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Current password and new password (min 6 chars) are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
});

module.exports = router;