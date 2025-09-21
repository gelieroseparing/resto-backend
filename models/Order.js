const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderType: { type: String, enum: ['dine-in','take-out','delivery'], default: 'dine-in' },
  items: [{
    category: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  additionalPayments: [{
    description: String,
    amount: Number
  }],
  totalAmount: Number,
  subtotal: Number,
  paymentMethod: String,
  createdBy: { type: String }, // username
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);