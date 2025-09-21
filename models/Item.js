const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Drinks', 'Snack'], 
    required: true 
  },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true }, // Add availability status
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);