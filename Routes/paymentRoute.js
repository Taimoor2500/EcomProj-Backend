const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/', async (req, res) => {
  const { paymentMethodId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
    });

    
    res.json({ status: 'succeeded', clientSecret: paymentIntent.client_secret });
  } catch (error) {
   
    res.status(500).json({ status: 'failed', error: error.message });
  }
});

module.exports = router;
