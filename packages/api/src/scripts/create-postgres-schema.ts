#!/usr/bin/env tsx

import 'reflect-metadata';
import { connectPostgres, AppDataSource } from '@/database/postgres';
import logger from '@/utils/logger';

async function createPostgresSchema() {
  logger.info('🏗️ Creating PostgreSQL schema...');

  try {
    // Connect to PostgreSQL
    await connectPostgres();
    logger.info('✅ PostgreSQL connection established');

    // Generate and run migrations
    await AppDataSource.synchronize(true); // This will create all tables
    logger.info('✅ Database schema created successfully');

    // List all tables
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    logger.info('📋 Created tables:');
    tables.forEach((table: any) => {
      logger.info(`   - ${table.table_name}`);
    });

    logger.info('🎉 PostgreSQL schema creation completed!');

  } catch (error) {
    logger.error('❌ Schema creation failed:', error);
    throw error;
  } finally {
    // Close connection
    await AppDataSource.destroy();
    logger.info('🔌 PostgreSQL connection closed');
  }
}

// Run schema creation if called directly
if (require.main === module) {
  createPostgresSchema()
    .then(() => {
      logger.info('✅ Schema creation script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Schema creation script failed:', error);
      process.exit(1);
    });
}

export { createPostgresSchema };
