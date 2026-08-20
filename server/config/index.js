const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crm',
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_me',
    expire: process.env.JWT_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 100000 : parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
    // Auth endpoints get a slightly tighter limit. 50 per 15 min is enough to
    // block brute-force attacks while never tripping up a real user, even
    // behind a reverse proxy where every visitor shares one IP.
    authMax: process.env.NODE_ENV === 'test' ? 100000 : parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 50,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'dev',
};

module.exports = config;