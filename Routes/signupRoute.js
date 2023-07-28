const express = require('express');
const router = express.Router();
const User = require('../Models/loginModel');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  const { email, password, name, role } = req.body; 

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'client', 
    });

    await newUser.save();

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
