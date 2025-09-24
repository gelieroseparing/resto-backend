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
      createdBy,
      userId: req.user.id // still keep track of who created it
    });

    // Update inventory quantities for each item in the order
    for (const item of items) {
      await Item.findByIdAndUpdate(
        item.itemId,
        { $inc: { quantity: -item.quantity } } // decrease stock
      );
    }

    // Populate the response with all order data
    const populatedOrder = await Order.findById(order._id)
      .populate('items.itemId', 'name price')
      .populate('createdBy', 'username');

    res.json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// LIST order history - Returns ALL orders for ALL users
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.itemId', 'name price')
      .populate('createdBy', 'username');

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.itemId', 'name price')
      .populate('createdBy', 'username');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// UPDATE order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.itemId', 'name price');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
