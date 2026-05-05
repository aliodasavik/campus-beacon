require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { archiveExpiredPosts } = require('../services/archiveService');

async function run() {
  await connectDB();
  const result = await archiveExpiredPosts({ actorEmail: 'system.archiveJob' });
  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}

run().catch(async err => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    console.error(disconnectErr);
  }
  process.exit(1);
});
