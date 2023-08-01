const express = require('express');
const router = express.Router();
const Order = require('../../Models/orderModel');



router.get('/', async (req, res) => {
  const perPage = 8;
  const page = parseInt(req.query.page) || 1;

  try {
    const totalOrders = await Order.countDocuments();

    const allOrders = await Order.find();
    let totalUnits = 0;
    let totalPrice = 0;
    for (const order of allOrders) {
      totalUnits += order.products.reduce((sum, product) => sum + product.quantity, 0);
      totalPrice += order.amount;
    }

    const totalPages = Math.ceil(totalOrders / perPage);

    const skip = (page - 1) * perPage;
    const orders = await Order.find({}).skip(skip).limit(perPage);

    res.json({ orders, totalPages, totalOrders, totalUnits, totalPrice });
  
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/search', async (req, res) => {
  const searchTerm = req.query.term;
  const page = parseInt(req.query.page) || 1;

  const perPage = 8;

  try {
    let basicFieldsMatch = {
      $or: [{ orderNumber: searchTerm }, { email: searchTerm }]
    };

    let productsMatch = {
      'products.title.name': searchTerm
    };

    const queryConditions = { $or: [basicFieldsMatch, productsMatch] };

    const totalOrders = await Order.countDocuments(queryConditions);

    const matchingOrders = await Order.find(queryConditions)
      .skip((page - 1) * perPage)
      .limit(perPage);

    let totalUnits = 0;
    let totalPrice = 0;
    for (const order of matchingOrders) {
      totalUnits += order.products.reduce((sum, product) => sum + product.quantity, 0);
      totalPrice += order.amount;
    }

    const totalPages = Math.ceil(totalOrders / perPage);

    res.json({ orders: matchingOrders, totalPages, totalOrders, totalUnits, totalPrice });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;


