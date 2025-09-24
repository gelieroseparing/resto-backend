const express = require('express');
const Order = require('../models/Order');
const Item = require('../models/Item');
const { verifyToken } = require('../middleware/auth'); // Import verifyToken

const router = express.Router();

/* ------------------------- CREATE ORDER ------------------------- */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { orderType, items, additionalPayments, totalAmount, subtotal, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }

    const order = await Order.create({
      orderType,
      items,
      additionalPayments,
      totalAmount,
      subtotal,
      paymentMethod,
      createdBy: req.user.userId,
      userId: req.user.userId,
    });

    // Decrease stock
    for (const item of items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('items.itemId', 'name price')
      .populate('createdBy', 'username');

    res.status(201).json({ message: 'Order created', order: populatedOrder });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

/* ------------------------- GET ALL ORDERS ------------------------- */
router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.itemId', 'name price')
      .populate('createdBy', 'username');

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

/* ------------------------- GET SINGLE ORDER ------------------------- */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.itemId', 'name price')
      .populate('createdBy', 'username');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

/* ------------------------- UPDATE ORDER STATUS ------------------------- */
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('items.itemId', 'name price')
      .populate('createdBy', 'username');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

module.exports = router;