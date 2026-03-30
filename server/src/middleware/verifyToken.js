const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access Denied. No token provided.' });

  const token = authHeader.split(' ')[1]; // Removes "Bearer " from the string
  if (!token) return res.status(401).json({ message: 'Access Denied. Invalid token format.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    req.user = verified; // Gives us req.user.id and req.user.email
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};