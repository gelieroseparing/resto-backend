const router = require('express').Router();
const Order = require('../models/Order');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// CREATE order
router.post('/', auth, async (req, res) => {
  try {
    const { orderType, items, additionalPayments, totalAmount, subtotal, paymentMethod, createdBy } = req.body;

    // Create the order
    const order = await Order.create({
      orderType,
      items,
      additionalPayments,
      totalAmount,
      subtotal,
      paymentMethod,
      createdBy
    });

    // Populate the response with all order data for the receipt
    res.json({
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderType: order.orderType,
        items: order.items,
        additionalPayments: order.additionalPayments,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        paymentMethod: order.paymentMethod,
        createdBy: order.createdBy,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// LIST order history
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;