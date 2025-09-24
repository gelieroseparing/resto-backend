const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

/* ---------------------- Multer setup for image uploads ---------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ---------------------- Async wrapper for centralized error handling ---------------------- */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* ----------------------------- USER SIGNUP ----------------------------- */
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { username, password, position } = req.body;

    if (!username || !password || !position)
      return res.status(400).json({ message: 'All fields are required' });

    if (username.length < 3)
      return res
        .status(400)
        .json({ message: 'Username must be at least 3 characters long' });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters long' });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, position });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, username: user.username, position: user.position },
    });
  })
);

/* ------------------------------ USER LOGIN ------------------------------ */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required' });

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
  })
);

/* ----------------------------- GET PROFILE ----------------------------- */
router.get(
  '/profile',
  auth,
  asyncHandler(async (req, res) => {
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
  })
);

/* ---------------------------- UPDATE PROFILE ---------------------------- */
router.put(
  '/profile',
  auth,
  upload.single('profileImage'),
  asyncHandler(async (req, res) => {
    const { username } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(400).json({ message: 'Username already taken' });
      user.username = username;
    }

    if (req.file) user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        position: user.position,
        profileImage: user.profileImage || '/uploads/profile.jpg',
      },
    });
  })
);

/* --------------------------- CHANGE PASSWORD --------------------------- */
router.put(
  '/change-password',
  auth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  })
);

/* ---------------------------- GET ALL USERS ---------------------------- */
router.get(
  '/users',
  auth,
  asyncHandler(async (req, res) => {
    // Optional: restrict to admins only
    // if (req.user.position !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  })
);

/* ---------------------- GLOBAL ERROR HANDLER ---------------------- */
router.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Max size 5MB.' });
    }
  }
  res.status(500).json({ message: err.message || 'Server error' });
});

module.exports = router;
