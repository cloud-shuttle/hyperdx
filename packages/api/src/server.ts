import 'reflect-metadata';
import express from 'express';
import compression from 'compression';
import session from 'express-session';
import cors from 'cors';
import { connectPostgres, disconnectPostgres } from '@/database/postgres';
import { databaseManager } from '@/database';
import * as config from '@/config';
import logger from '@/utils/logger';
import gracefulShutdown from 'http-graceful-shutdown';
import { createServer } from 'http';

import apiApp from './api-app';

const app = express();
const server = createServer(app);

// Middleware
app.use(compression());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Session configuration
app.use(session({
  secret: config.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.IS_PROD,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// API routes
app.use('/api', apiApp);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Graceful shutdown
gracefulShutdown(server, {
  signals: 'SIGINT SIGTERM',
  timeout: 10000,
  development: config.IS_DEV,
  onShutdown: async () => {
    logger.info('🔄 Shutting down gracefully...');
    
    // Close database connection
    try {
      await databaseManager.disconnect();
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
    
    logger.info('✅ Graceful shutdown completed');
  },
  finally: () => {
    logger.info('👋 Server stopped');
    process.exit(0);
  },
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await databaseManager.connect();
    
    const port = config.PORT || 3001;
    server.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Frontend URL: ${config.FRONTEND_URL}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
