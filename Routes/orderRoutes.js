const express = require('express');
const router = express.Router();
const Order = require('../Models/orderModel');

router.get('/', (req, res) => {
  const { email } = req.query;

  Order.find({ email })
    .then((orders) => {
      res.status(200).json(orders);
    })
    .catch((error) => {
      console.error('Error retrieving orders:', error);
      res.status(500).json({ error: 'Error retrieving orders' });
    });
});

router.post('/', (req, res) => {
 
 
  const orderData = { ...req.body }; 

  console.log(orderData);

  const newOrder = new Order(orderData);
  newOrder
    .save()
    .then(() => {
      res.status(201).json({ message: 'Order saved successfully' });
    })
    .catch((error) => {
      res.status(500).json({ error: 'Error saving order', errorMessage: error });
    });
});

module.exports = router;
