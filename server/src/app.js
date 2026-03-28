const express = require('express');
const cors = require('cors');

// 1. Import your route files (Only once!)
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// 2. Standard middleware
app.use(cors());
app.use(express.json());

// 3. Register your API routes (Only once!)
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);

// 4. Base health-check route
app.get('/', (req, res) => res.send({ ok: true, message: 'CampusBeacon API' }));

module.exports = app;