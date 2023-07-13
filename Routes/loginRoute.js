const express = require('express');
const router = express.Router();
const User = require('../Models/loginModel');


router.post('/', async (req, res) => {
  const { username, password } = req.body;

  try {
 
    const user = await User.findOne({ username });

    if (user && user.password === password) {
      
      res.status(200).json({ message: 'Login successful' });
    } else {
      
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*router.post('/', (req, res) => {
    const { username, password } = req.body;

    const user = new User({
      username,
      password,
    });

    user.save().then(() => {
      res.status(200).send({ success: true });
    }).catch((err) => {
      res.status(500).send(err);
    });
  });*/

module.exports = router;

