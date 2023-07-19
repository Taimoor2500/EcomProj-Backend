const express = require('express');
const passport = require('../Middlewares/passport');
const jwt = require('jsonwebtoken');
const User = require('../Models/loginModel');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const router = express.Router();
const secretKey = new mongoose.Types.ObjectId().toString();

let resetTokenMap = {};

router.post('/', passport.authenticate('local', { session: false }), (req, res) => {
  const { email, name } = req.user;
  const token = jwt.sign({ email, name }, secretKey, { expiresIn: '1h' });

  return res.status(200).json({ message: 'Login successful', token, name, email });
});

const generateResetToken = () => {
  const resetToken = jwt.sign({ data: 'reset' }, secretKey, { expiresIn: '1h' });
  return resetToken;
};

router.post('/check', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const resetToken = generateResetToken();

    resetTokenMap[resetToken] = email; 

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    
    res.status(200).json({ message: 'Token sent successfully', resetToken });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'yt629747@gmail.com',
        pass: 'zsfalzbukqviysvx',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: 'yt629747@gmail.com',
      to: email,
      subject: 'Password Reset Confirmation',
      text: `You have requested to reset your password. Your reset token is: ${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Error checking email' });
  }
});

router.post('/validate-token', async (req, res) => {
  const { resetToken } = req.body;
  const email = resetTokenMap[resetToken]; 

  try {
    if (!email) {
      return res.json({ isValid: false });
    }

    const user = await User.findOne({ email });

    if (!user || user.resetTokenExpiry < Date.now()) {
      return res.json({ isValid: false });
    }

    return res.json({ isValid: true });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Error validating token' });
  }
});

router.put('/password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Error updating password' });
  }
});

module.exports = router;
