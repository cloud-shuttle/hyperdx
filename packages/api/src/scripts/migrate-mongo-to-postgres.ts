#!/usr/bin/env tsx

import 'reflect-metadata';
import mongoose from 'mongoose';
import { connectPostgres, AppDataSource } from '@/database/postgres';
import { connectDB } from '@/models';
import * as config from '@/config';
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

// Import PostgreSQL repositories
import { TeamRepository, UserRepository, AlertRepository, DashboardRepository, SavedSearchRepository, SourceRepository, WebhookRepository, TeamInviteRepository } from '@/database/postgres';

async function migrateMongoToPostgres() {
  logger.info('🚀 Starting MongoDB to PostgreSQL migration...');

  try {
    // Connect to both databases
    await connectPostgres();
    await connectDB();

    logger.info('✅ Connected to both databases');

    // Migrate Teams
    logger.info('📦 Migrating teams...');
    const teams = await Team.find({}).lean();
    for (const team of teams) {
      const existingTeam = await TeamRepository.findOne({ where: { tenantId: team.tenantId } });
      if (!existingTeam) {
        await TeamRepository.save({
          id: team._id.toString(),
          name: team.name,
          tenantId: team.tenantId,
          tenantName: team.tenantName,
          apiKey: team.apiKey,
          hookId: team.hookId,
          collectorAuthenticationEnforced: team.collectorAuthenticationEnforced || false,
          dataRetentionDays: team.dataRetentionDays || 30,
          maxUsersPerTenant: team.maxUsersPerTenant || 10,
          allowedIngestionRate: team.allowedIngestionRate || 10000,
          storageQuotaGB: team.storageQuotaGB || 10,
          featuresEnabled: team.featuresEnabled || {},
          clickstackSettings: team.clickstackSettings || {},
          metadataMaxRowsToRead: team.metadataMaxRowsToRead,
          searchRowLimit: team.searchRowLimit,
          fieldMetadataDisabled: team.fieldMetadataDisabled || false,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        });
      }
    }
    logger.info(`✅ Migrated ${teams.length} teams`);

    // Migrate Users
    logger.info('👥 Migrating users...');
    const users = await User.find({}).lean();
    for (const user of users) {
      const existingUser = await UserRepository.findOne({ where: { email: user.email } });
      if (!existingUser) {
        await UserRepository.save({
          id: user._id.toString(),
          email: user.email,
          password: user.password,
          name: user.name,
          teamId: user.team.toString(),
          avatar: user.avatar,
          isAdmin: user.isAdmin || false,
          isActive: user.isActive !== false,
          lastLoginAt: user.lastLoginAt,
          preferences: user.preferences || {},
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      }
    }
    logger.info(`✅ Migrated ${users.length} users`);

    // Migrate Alerts
    logger.info('🚨 Migrating alerts...');
    const alerts = await Alert.find({}).lean();
    for (const alert of alerts) {
      const existingAlert = await AlertRepository.findOne({ where: { id: alert._id.toString() } });
      if (!existingAlert) {
        await AlertRepository.save({
          id: alert._id.toString(),
          name: alert.name,
          description: alert.description,
          teamId: alert.team.toString(),
          savedSearchId: alert.savedSearch?.toString(),
          source: alert.source || 'logs',
          type: alert.type || 'count',
          query: alert.query || {},
          operator: alert.operator || 'gt',
          threshold: alert.threshold || 0,
          windowSizeInMinutes: alert.windowSizeInMinutes || 5,
          isEnabled: alert.isEnabled !== false,
          channels: alert.channels || [],
          lastTriggeredAt: alert.lastTriggeredAt,
          triggerCount: alert.triggerCount || 0,
          createdAt: alert.createdAt,
          updatedAt: alert.updatedAt,
        });
      }
    }
    logger.info(`✅ Migrated ${alerts.length} alerts`);

    // Migrate Saved Searches
    logger.info('🔍 Migrating saved searches...');
    const savedSearches = await SavedSearch.find({}).lean();
    for (const search of savedSearches) {
      const existingSearch = await SavedSearchRepository.findOne({ where: { id: search._id.toString() } });
      if (!existingSearch) {
        await SavedSearchRepository.save({
          id: search._id.toString(),
          name: search.name,
          description: search.description,
          teamId: search.team.toString(),
          source: search.source || 'logs',
          query: search.query || '',
          filters: search.filters || {},
          isDefault: search.isDefault || false,
          isPublic: search.isPublic !== false,
          createdById: search.createdBy?.toString(),
          createdAt: search.createdAt,
          updatedAt: search.updatedAt,
        });
      }
    }
    logger.info(`✅ Migrated ${savedSearches.length} saved searches`);

    // Migrate Dashboards
    logger.info('📊 Migrating dashboards...');
    const dashboards = await Dashboard.find({}).lean();
    for (const dashboard of dashboards) {
      const existingDashboard = await DashboardRepository.findOne({ where: { id: dashboard._id.toString() } });
      if (!existingDashboard) {
        await DashboardRepository.save({
          id: dashboard._id.toString(),
          name: dashboard.name,
          description: dashboard.description,
          teamId: dashboard.team.toString(),
          tiles: dashboard.tiles || [],
          isDefault: dashboard.isDefault || false,
          isPublic: dashboard.isPublic !== false,
          createdById: dashboard.createdBy?.toString(),
          createdAt: dashboard.createdAt,
          updatedAt: dashboard.updatedAt,
        });
      }
    }
    logger.info(`✅ Migrated ${dashboards.length} dashboards`);

    // Migrate Sources
    logger.info('📡 Migrating sources...');
    const sources = await Source.find({}).lean();
    for (const source of sources) {
      const existingSource = await SourceRepository.findOne({ where: { id: source._id.toString() } });
      if (!existingSource) {
        await SourceRepository.save({
          id: source._id.toString(),
          name: source.name,
          description: source.description,
          teamId: source.team.toString(),
          type: source.type || 'logs',
          config: source.config || {},
          isEnabled: source.isEnabled !== false,
          lastIngestionAt: source.lastIngestionAt,
          ingestionCount: source.ingestionCount || 0,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt,
        });
      }
    }
    logger.info(`✅ Migrated ${sources.length} sources`);

    // Migrate Webhooks
    logger.info('🔗 Migrating webhooks...');
    const webhooks = await Webhook.find({}).lean();
    for (const webhook of webhooks) {
      const existingWebhook = await WebhookRepository.findOne({ where: { id: webhook._id.toString() } });
      if (!existingWebhook) {
        await WebhookRepository.save({
          id: webhook._id.toString(),
          name: webhook.name,
          description: webhook.description,
          teamId: webhook.team.toString(),
          url: webhook.url,
          method: webhook.method || 'POST',
          headers: webhook.headers || {},
          events: webhook.events || [],
          isEnabled: webhook.isEnabled !== false,
          lastTriggeredAt: webhook.lastTriggeredAt,
          triggerCount: webhook.triggerCount || 0,
          errorCount: webhook.errorCount || 0,
          createdAt: webhook.createdAt,
          updatedAt: webhook.updatedAt,
        });
      }
    }
    logger.info(`✅ Migrated ${webhooks.length} webhooks`);

    // Migrate Team Invites
    logger.info('📧 Migrating team invites...');
    const teamInvites = await TeamInvite.find({}).lean();
    for (const invite of teamInvites) {
      const existingInvite = await TeamInviteRepository.findOne({ where: { id: invite._id.toString() } });
      if (!existingInvite) {
        await TeamInviteRepository.save({
          id: invite._id.toString(),
          email: invite.email,
          teamId: invite.team.toString(),
          token: invite.token,
          status: invite.status || 'pending',
          expiresAt: invite.expiresAt,
          invitedById: invite.invitedBy?.toString(),
          acceptedById: invite.acceptedBy?.toString(),
          acceptedAt: invite.acceptedAt,
          createdAt: invite.createdAt,
          updatedAt: invite.updatedAt,
        });
      }
    }
    logger.info(`✅ Migrated ${teamInvites.length} team invites`);

    logger.info('🎉 Migration completed successfully!');
    logger.info('📊 Migration Summary:');
    logger.info(`   - Teams: ${teams.length}`);
    logger.info(`   - Users: ${users.length}`);
    logger.info(`   - Alerts: ${alerts.length}`);
    logger.info(`   - Saved Searches: ${savedSearches.length}`);
    logger.info(`   - Dashboards: ${dashboards.length}`);
    logger.info(`   - Sources: ${sources.length}`);
    logger.info(`   - Webhooks: ${webhooks.length}`);
    logger.info(`   - Team Invites: ${teamInvites.length}`);

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    await mongoose.connection.close();
    await AppDataSource.destroy();
    logger.info('🔌 Database connections closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateMongoToPostgres()
    .then(() => {
      logger.info('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateMongoToPostgres };
