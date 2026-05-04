const express = require('express');
const cors = require('cors');

// 1. Import your route files
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// 2. Standard middleware MUST go before any routes!
app.use(cors({
  origin: 'http://localhost:3000', // Allow React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email'] // Allow your custom headers
}));
app.use(express.json()); // Allows server to read req.body

// 3. Register your API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chats', chatRoutes);

// 4. Base health-check route
app.get('/', (req, res) => res.send({ ok: true, message: 'CampusBeacon API' }));

module.exports = app;