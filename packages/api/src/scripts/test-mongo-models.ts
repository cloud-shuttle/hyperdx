#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { connectDB } from '@/models';
import logger from '@/utils/logger';

// Import MongoDB models
import Team from '@/models/team';
import User from '@/models/user';
import Alert from '@/models/alert';
import Dashboard from '@/models/dashboard';
import { SavedSearch } from '@/models/savedSearch';
import { Source } from '@/models/source';
import Webhook from '@/models/webhook';
import TeamInvite from '@/models/teamInvite';

async function testMongoModels() {
  logger.info('🧪 Testing MongoDB models...');

  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✅ MongoDB connection established');

    // Test each model
    logger.info('📦 Testing Team model...');
    const teamCount = await Team.countDocuments();
    logger.info(`   Team count: ${teamCount}`);

    logger.info('👥 Testing User model...');
    const userCount = await User.countDocuments();
    logger.info(`   User count: ${userCount}`);

    logger.info('🚨 Testing Alert model...');
    const alertCount = await Alert.countDocuments();
    logger.info(`   Alert count: ${alertCount}`);

    logger.info('🔍 Testing SavedSearch model...');
    const savedSearchCount = await SavedSearch.countDocuments();
    logger.info(`   SavedSearch count: ${savedSearchCount}`);

    logger.info('📊 Testing Dashboard model...');
    const dashboardCount = await Dashboard.countDocuments();
    logger.info(`   Dashboard count: ${dashboardCount}`);

    logger.info('📡 Testing Source model...');
    const sourceCount = await Source.countDocuments();
    logger.info(`   Source count: ${sourceCount}`);

    logger.info('🔗 Testing Webhook model...');
    const webhookCount = await Webhook.countDocuments();
    logger.info(`   Webhook count: ${webhookCount}`);

    logger.info('📧 Testing TeamInvite model...');
    const teamInviteCount = await TeamInvite.countDocuments();
    logger.info(`   TeamInvite count: ${teamInviteCount}`);

    logger.info('🎉 MongoDB models test completed successfully!');

  } catch (error) {
    logger.error('❌ MongoDB models test failed:', error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    logger.info('🔌 MongoDB connection closed');
  }
}

// Run test if called directly
if (require.main === module) {
  testMongoModels()
    .then(() => {
      logger.info('✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testMongoModels };
