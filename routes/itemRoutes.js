const express = require('express');
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

const router = express.Router();

/* ---------------------- Multer setup for item images ---------------------- */
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

/* ------------------------- CREATE ITEM ------------------------- */
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    if (!name || !price || !quantity) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const item = await Item.create({
      name,
      price,
      quantity,
      image: req.file ? `/uploads/${req.file.filename}` : undefined,
    });

    res.status(201).json({ message: 'Item created', item });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ message: 'Failed to create item' });
  }
});

/* ------------------------- GET ALL ITEMS ------------------------- */
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

/* ------------------------- GET SINGLE ITEM ------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error('Error fetching item:', err);
    res.status(500).json({ message: 'Failed to fetch item' });
  }
});

/* ------------------------- UPDATE ITEM ------------------------- */
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });

    res.json({ message: 'Item updated', item: updatedItem });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

/* ------------------------- DELETE ITEM ------------------------- */
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

module.exports = router;
