const express = require('express');
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create Order: accessible to all roles
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('=== BACKEND: ORDER CREATION STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from token:', req.user);

    const {
      orderType,
      items,
      additionalPayments = [],
      totalAmount,
      subtotal,
      paymentMethod,
      createdBy
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      console.log('BACKEND: No items in order');
      return res.status(400).json({ 
        success: false,
        message: 'Order must include at least one item' 
      });
    }

    // Validate required fields
    const missingFields = [];
    if (!orderType) missingFields.push('orderType');
    if (!totalAmount && totalAmount !== 0) missingFields.push('totalAmount');
    if (!subtotal && subtotal !== 0) missingFields.push('subtotal');
    if (!paymentMethod) missingFields.push('paymentMethod');

    if (missingFields.length > 0) {
      console.log('BACKEND: Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    console.log('BACKEND: Creating order in database...');
    
    // Create the order
    const orderData = {
      orderType,
      items,
      additionalPayments,
      totalAmount: parseFloat(totalAmount),
      subtotal: parseFloat(subtotal),
      paymentMethod,
      createdBy: createdBy || req.user.username || req.user.userId || 'Unknown',
    };

    console.log('BACKEND: Order data to save:', orderData);

    const order = await Order.create(orderData);

    console.log('BACKEND: Order created successfully:', order._id);

    // Return the complete order data with proper structure
    res.status(201).json({ 
      success: true,
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
    console.error('BACKEND: Error creating order:', err);
    console.error('BACKEND: Error stack:', err.stack);
    
    // More specific error messages
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create order', 
      error: err.message 
    });
  }
});

// Get all orders: all roles
router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders: orders
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders' 
    });
  }
});

// Get single order
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ 
      success: false,
      message: 'Order not found' 
    });
    
    res.json({
      success: true,
      order: order
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch order' 
    });
  }
});

module.exports = router;