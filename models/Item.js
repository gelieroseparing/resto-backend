const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Drinks', 'Snack'], 
    required: true 
  },
  price: { type: Number, required: true },
  description: { type: String, default: '' }, // For MenuPage
  imageUrl: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true }, // For HomePage/MenuPage
  stock: { type: Number, default: 999 }, // Added for order decrement (high default to avoid immediate sold-out)
  rating: { type: Number, default: 0, min: 0, max: 5 }, // For HomePage "Best Rated" (default 0 if not set)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);