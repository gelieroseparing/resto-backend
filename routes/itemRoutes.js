const express = require('express');
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Multer setup
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Create Item: Only `chief`
router.post('/', verifyToken, requireRole('chief'), upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, description, isAvailable, stock, rating } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    const newItem = new Item({
      name,
      category,
      price: parseFloat(price),
      isAvailable: isAvailable !== undefined ? JSON.parse(isAvailable) : true,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
    });
    await newItem.save();

    const responseItem = {
      ...newItem.toObject(),
      description: '', // Defaults
      stock: 0,
      rating: 0,
    };
    res.status(201).json({ message: 'Item added successfully!', item: responseItem });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
});

// Get all items: accessible to all roles
router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    const responseItems = items.map(item => ({
      ...item.toObject(),
      description: '',
      stock: 0,
      rating: 0,
    }));
    res.json(responseItems);
  } catch (err) {
    console.error('Error loading items:', err);
    res.status(500).json({ message: 'Failed to load items' });
  }
});

// Get single item
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const responseItem = {
      ...item.toObject(),
      description: '',
      stock: 0,
      rating: 0,
    };
    res.json(responseItem);
  } catch (err) {
    console.error('Error fetching item:', err);
    res.status(500).json({ message: 'Failed to fetch item' });
  }
});

// Update item: role-based restrictions
router.put('/:id', verifyToken, async (req, res) => {
  const { name, category, price, description, isAvailable, stock, rating } = req.body;
  const itemId = req.params.id;

  // Only chief can update all fields
  if (req.user.position !== 'chief') {
    // Non-chief: only toggle isAvailable
    if (
      Object.keys(req.body).length !== 1 ||
      !('isAvailable' in req.body)
    ) {
      return res.status(403).json({ message: 'Only availability can be updated' });
    }
  }

  const updateData = {};
  if (name && req.user.position === 'chief') updateData.name = name;
  if (category && req.user.position === 'chief') updateData.category = category;
  if (price && req.user.position === 'chief') updateData.price = parseFloat(price);
  if ('isAvailable' in req.body) updateData.isAvailable = JSON.parse(isAvailable);
  if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

  try {
    const updatedItem = await Item.findByIdAndUpdate(itemId, updateData, { new: true });
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    const responseItem = {
      ...updatedItem.toObject(),
      description: description || '',
      stock: stock ? parseInt(stock) : 0,
      rating: rating ? parseFloat(rating) : 0,
    };
    res.json({ message: 'Item updated successfully!', item: responseItem });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Delete item: only chief
router.delete('/:id', verifyToken, requireRole('chief'), async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully!' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

module.exports = router;