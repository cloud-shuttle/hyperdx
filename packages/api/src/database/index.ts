import { connectPostgres, AppDataSource } from './postgres';
import { connectDB, mongooseConnection } from '@/models';
import * as config from '@/config';
import logger from '@/utils/logger';

// Database connection manager
export class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      // Always use PostgreSQL for new deployments
      logger.info('Connecting to PostgreSQL...');
      await connectPostgres();
      
      // Initialize TypeORM
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        logger.info('TypeORM DataSource initialized');
      }

      this.isConnected = true;
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        logger.info('TypeORM DataSource destroyed');
      }
      
      this.isConnected = false;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting database:', error);
      throw error;
    }
  }

  isDatabaseConnected(): boolean {
    return this.isConnected && AppDataSource.isInitialized;
  }

  getDataSource() {
    return AppDataSource;
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Legacy exports for backward compatibility
export { AppDataSource } from './postgres';
export { connectPostgres } from './postgres';

// For migration purposes only - will be removed
export const connectMongoDB = async () => {
  logger.warn('MongoDB connection is deprecated, using PostgreSQL instead');
  return databaseManager.connect();
};
