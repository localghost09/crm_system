const app = require('./app');
const connectDB = require('./database/connection');
const config = require('./config');

// Start cron jobs
require('./jobs');

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(config.port, '0.0.0.0', () => {
      console.log('CRM Server running on port ' + config.port);
      console.log('Environment: ' + config.nodeEnv);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();