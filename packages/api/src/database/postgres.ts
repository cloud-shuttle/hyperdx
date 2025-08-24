import { DataSource } from 'typeorm';
import * as config from '@/config';
import logger from '@/utils/logger';

// Import all entities
import { User } from '@/entities/User';
import { Team } from '@/entities/Team';
import { Alert } from '@/entities/Alert';
import { Dashboard } from '@/entities/Dashboard';
import { SavedSearch } from '@/entities/SavedSearch';
import { Source } from '@/entities/Source';
import { Webhook } from '@/entities/Webhook';
import { TeamInvite } from '@/entities/TeamInvite';

// Create TypeORM DataSource
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  username: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD,
  database: config.POSTGRES_DATABASE,
  ssl: config.POSTGRES_SSL ? { rejectUnauthorized: false } : false,
  synchronize: config.IS_DEV, // Auto-create tables in development
  logging: config.IS_DEV,
  entities: [
    User,
    Team,
    Alert,
    Dashboard,
    SavedSearch,
    Source,
    Webhook,
    TeamInvite,
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
});

// Database connection management
export const connectPostgres = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('✅ PostgreSQL connection established');
  } catch (error) {
    logger.error('❌ Could not connect to PostgreSQL:', error);
    throw error;
  }
};

export const disconnectPostgres = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    logger.info('✅ PostgreSQL connection closed');
  } catch (error) {
    logger.error('❌ Error closing PostgreSQL connection:', error);
    throw error;
  }
};

// Repository exports for easy access
export const UserRepository = AppDataSource.getRepository(User);
export const TeamRepository = AppDataSource.getRepository(Team);
export const AlertRepository = AppDataSource.getRepository(Alert);
export const DashboardRepository = AppDataSource.getRepository(Dashboard);
export const SavedSearchRepository = AppDataSource.getRepository(SavedSearch);
export const SourceRepository = AppDataSource.getRepository(Source);
export const WebhookRepository = AppDataSource.getRepository(Webhook);
export const TeamInviteRepository = AppDataSource.getRepository(TeamInvite);

// Utility function to check if database is connected
export const isPostgresConnected = (): boolean => {
  return AppDataSource.isInitialized;
};
