const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file) return cb(null, true);
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

// CREATE item
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, isAvailable } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    
    const item = await Item.create({ 
      name, 
      price, 
      category, 
      imageUrl,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' : true
    });
    
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// UPDATE item
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, isAvailable } = req.body;
    const updateData = { name, price, category };
    
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true';

    const item = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE item
router.delete('/:id', auth, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// GET all items - Filter unavailable items for non-admin users
router.get('/', async (req, res) => {
  try {
    // Check if request is from admin (has authorization header)
    const isAdminRequest = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
    
    let items;
    if (isAdminRequest) {
      // Admins can see all items
      items = await Item.find();
    } else {
      // Customers only see available items
      items = await Item.find({ isAvailable: true });
    }
    
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

module.exports = router;