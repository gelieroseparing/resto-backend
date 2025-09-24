// routes/orderRoutes.js
const express = require('express');
const Order = require('../models/Order');
const Item = require('../models/Item');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

/* --------------------------- CREATE ORDER --------------------------- */
router.post('/', verifyToken, requireManager, async (req, res) => {
  try {
    const { orderType, items, additionalPayments, totalAmount, subtotal, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for the order' });
    }

    // Create order
    const order = await Order.create({
      orderType,
      items,
      additionalPayments,
      totalAmount,
      subtotal,
      paymentMethod,
      createdBy: req.user.username,
      userId: req.user.id,
    });

    // Decrease item stock
    for (const item of items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
    }

    // Populate response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.itemId', 'name price')
      .populate('userId', 'username');

    res.status(201).json({ message: 'Order created successfully', order: populatedOrder });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

/* --------------------------- GET ALL ORDERS --------------------------- */
router.get('/', verifyToken, requireManager, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.itemId', 'name price')
      .populate('userId', 'username');

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

/* --------------------------- GET SINGLE ORDER --------------------------- */
router.get('/:id', verifyToken, requireManager, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.itemId', 'name price')
      .populate('userId', 'username');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

/* --------------------------- UPDATE ORDER STATUS --------------------------- */
router.patch('/:id/status', verifyToken, requireManager, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('items.itemId', 'name price')
      .populate('userId', 'username');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

module.exports = router;
