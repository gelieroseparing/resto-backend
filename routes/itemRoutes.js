const express = require('express');
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');
const { verifyToken } = require('../middleware/auth');

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

// Create Item: ALL users can create items
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, description, isAvailable, stock, rating } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    const newItem = new Item({
      name,
      category,
      price: parseFloat(price),
      description: description || '',
      isAvailable: isAvailable !== undefined ? JSON.parse(isAvailable) : true,
      stock: stock ? parseInt(stock) : 999,
      rating: rating ? parseFloat(rating) : 0,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
    });
    await newItem.save();

    res.status(201).json({ message: 'Item added successfully!', item: newItem });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
});

// Get all items: accessible to all roles
router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
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
    res.json(item);
  } catch (err) {
    console.error('Error fetching item:', err);
    res.status(500).json({ message: 'Failed to fetch item' });
  }
});

// Update item: ALL users can update items
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, description, isAvailable, stock, rating } = req.body;
    const itemId = req.params.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (price) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (rating !== undefined) updateData.rating = parseFloat(rating);
    if ('isAvailable' in req.body) updateData.isAvailable = JSON.parse(isAvailable);
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

    const updatedItem = await Item.findByIdAndUpdate(itemId, updateData, { new: true });
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    
    res.json({ message: 'Item updated successfully!', item: updatedItem });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Delete item: ALL users can delete items
router.delete('/:id', verifyToken, async (req, res) => {
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