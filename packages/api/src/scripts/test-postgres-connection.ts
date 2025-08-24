#!/usr/bin/env tsx

import 'reflect-metadata';
import { connectPostgres, AppDataSource, TeamRepository } from '@/database/postgres';
import logger from '@/utils/logger';

async function testPostgresConnection() {
  logger.info('🧪 Testing PostgreSQL connection...');

  try {
    // Connect to PostgreSQL
    await connectPostgres();
    logger.info('✅ PostgreSQL connection established');

    // Test creating a simple team
    const testTeam = await TeamRepository.save({
      name: 'Test Team',
      tenantId: 'test-tenant-123',
      tenantName: 'Test Tenant',
      apiKey: 'test-api-key',
      hookId: 'test-hook-id',
      collectorAuthenticationEnforced: false,
      dataRetentionDays: 30,
      maxUsersPerTenant: 10,
      allowedIngestionRate: 10000,
      storageQuotaGB: 10,
      featuresEnabled: {},
      clickstackSettings: {},
      fieldMetadataDisabled: false,
    });

    logger.info('✅ Test team created:', testTeam.id);

    // Test querying the team
    const foundTeam = await TeamRepository.findOne({ where: { tenantId: 'test-tenant-123' } });
    logger.info('✅ Test team retrieved:', foundTeam?.name);

    // Clean up
    await TeamRepository.remove(testTeam);
    logger.info('✅ Test team cleaned up');

    logger.info('🎉 PostgreSQL test completed successfully!');

  } catch (error) {
    logger.error('❌ PostgreSQL test failed:', error);
    throw error;
  } finally {
    // Close connection
    await AppDataSource.destroy();
    logger.info('🔌 PostgreSQL connection closed');
  }
}

// Run test if called directly
if (require.main === module) {
  testPostgresConnection()
    .then(() => {
      logger.info('✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testPostgresConnection };
