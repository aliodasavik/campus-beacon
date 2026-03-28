require('dotenv').config();
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const app = require('./app');
const connectDB = require('./config/db');
const Item = require('./models/Item'); // <-- 1. IMPORT THE ITEM MODEL

const PORT = process.env.PORT || 5000;

connectDB().then(async () => { // <-- 2. ADD 'async' HERE
  
  // =======================================================
  // TEMPORARY CODE TO FIX THE SEARCH INDEX
  console.log('Attempting to drop old search indexes...');
  await Item.collection.dropIndexes();
  console.log('Indexes dropped. New indexes will be rebuilt on startup.');
  // =======================================================

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to connect DB', err);
  process.exit(1);
});