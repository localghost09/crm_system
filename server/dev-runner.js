/**
 * Development runner: starts in-memory MongoDB, seeds demo data,
 * then boots the Express server. Perfect for local demo without
 * installing MongoDB. In production, use a real MongoDB Atlas/self-hosted URI.
 *
 * Note: MongoDB data is kept inside ./data (workspace) so sandboxed
 * /tmp partitions don't fill up.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '.data', 'mongo');

(async () => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('🚀 Starting in-memory MongoDB...');
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbPath: DATA_DIR,
      storageEngine: 'wiredTiger',
    },
  });
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  console.log('✅ MongoDB ready');

  // Seed the database
  console.log('🌱 Seeding database...');
  const seedProc = spawn(process.execPath, [path.join(__dirname, 'database', 'seed.js')], {
    env: { ...process.env, MONGODB_URI: uri },
    stdio: 'inherit',
  });

  seedProc.on('exit', (code) => {
    if (code !== 0) {
      console.error('❌ Seeding failed with code', code);
      process.exit(1);
    }
    console.log('✅ Database seeded. Starting server...');

    // Start the server
    const serverProc = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
      env: { ...process.env, MONGODB_URI: uri },
      stdio: 'inherit',
    });
    serverProc.on('exit', async (code) => {
      await mongo.stop();
      process.exit(code || 0);
    });
  });
})().catch((err) => {
  console.error('Failed to start dev environment:', err.message);
  process.exit(1);
});
