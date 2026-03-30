// Server/src/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configure Email Sender (Requires EMAIL_USER and EMAIL_PASS in .env)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if domain matches .edu or your allowed domain
    const allowed = process.env.ALLOWED_EMAIL_DOMAIN || 'g.bracu.ac.bd';
    if (!email.endsWith(`@${allowed}`)) {
      return res.status(400).json({ message: `Must use a valid @${allowed} email.` });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

    const user = new User({ username, email, password: hashedPassword, otp });
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your Campus Account',
      text: `Your OTP for verification is: ${otp}`
    });

    res.status(201).json({ message: 'OTP sent to email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otp = undefined; // clear OTP
    await user.save();

    res.status(200).json({ message: 'Email verified! You can now login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
    
    // Send back token AND email so your frontend still works exactly as before
    res.status(200).json({ token, email: user.email, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this at the bottom of authController.js
exports.updateProfile = async (req, res) => {
  try {
    const { newUsername, newPassword } = req.body;
    
    // Find the logged-in user using the ID from the token
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update username if provided
    if (newUsername) {
      // Check if username is already taken by someone else
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = newUsername;
    }

    // Update password if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    await user.save();
    res.status(200).json({ message: 'Profile updated successfully!', username: user.username });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    // req.user.id comes from the verifyToken middleware
    const user = await User.findByIdAndDelete(req.user.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};