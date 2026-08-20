process.env.NODE_ENV = 'test';
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { User } = require('./models');

(async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const u = await User.create({ name: 'Tester', email: 't@t.com', password: 'Test@1234', role: 'executive' });

  // Simulate login: save refreshToken on user
  u.refreshToken = 'token-v1';
  await u.save({ validateBeforeSave: false });

  // Reload with +refreshToken
  const loaded = await User.findById(u._id).select('+refreshToken');
  console.log('After login, stored refreshToken:', loaded.refreshToken);

  // Simulate refresh: set new token, save
  loaded.refreshToken = 'token-v2';
  await loaded.save({ validateBeforeSave: false });

  // Reload again
  const reloaded = await User.findById(u._id).select('+refreshToken');
  console.log('After refresh, stored refreshToken:', reloaded.refreshToken);
  console.log('Rotation persisted:', reloaded.refreshToken === 'token-v2' ? 'YES' : 'NO');

  await mongo.stop();
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
