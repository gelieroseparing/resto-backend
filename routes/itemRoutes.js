// routes/itemRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file) return cb(null, true);
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// CREATE item (admin only)
router.post('/', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, isAvailable } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const item = await Item.create({
      name,
      price,
      category,
      imageUrl,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' : true,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Item creation error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// UPDATE item (admin only)
router.put('/:id', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, isAvailable } = req.body;
    const updateData = { name, price, category };

    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true';

    const item = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(item);
  } catch (err) {
    console.error('Item update error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE item (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.imageUrl) {
      const imgPath = path.join(__dirname, '..', item.imageUrl.replace('/', path.sep));
      fs.unlink(imgPath, (err) => {
        if (err) console.warn('Image not found or already deleted:', err.message);
      });
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Item deletion error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// GET all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find({ isAvailable: true });
    res.json(items);
  } catch (err) {
    console.error('Fetch items error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

module.exports = router;
