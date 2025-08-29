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

// Import PostgreSQL entities with aliases
import { Team as TeamEntity } from '@/entities/Team';
import { User as UserEntity } from '@/entities/User';
import { Alert as AlertEntity } from '@/entities/Alert';
import { Dashboard as DashboardEntity } from '@/entities/Dashboard';
import { SavedSearch as SavedSearchEntity } from '@/entities/SavedSearch';
import { Source as SourceEntity } from '@/entities/Source';
import { Webhook as WebhookEntity } from '@/entities/Webhook';
import { TeamInvite as TeamInviteEntity } from '@/entities/TeamInvite';

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
      const existingTeam = await AppDataSource.getRepository(TeamEntity).findOne({ where: { tenantId: team.tenantId } });
      if (!existingTeam) {
        await AppDataSource.getRepository(TeamEntity).save({
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
          createdAt: (team as any).createdAt || new Date(),
          updatedAt: (team as any).updatedAt || new Date(),
        });
      }
    }
    logger.info(`✅ Migrated ${teams.length} teams`);

    // Migrate Users
    logger.info('👥 Migrating users...');
    const users = await User.find({}).lean();
    for (const user of users) {
      const existingUser = await AppDataSource.getRepository(UserEntity).findOne({ where: { email: user.email } });
      if (!existingUser) {
        await AppDataSource.getRepository(UserEntity).save({
          id: user._id.toString(),
          email: user.email,
          password: (user as any).password || '',
          name: user.name,
          teamId: user.team.toString(),
          avatar: (user as any).avatar || '',
          isAdmin: (user as any).isAdmin || false,
          isActive: (user as any).isActive !== false,
          lastLoginAt: (user as any).lastLoginAt || null,
          preferences: (user as any).preferences || {},
          createdAt: (user as any).createdAt || new Date(),
          updatedAt: (user as any).updatedAt || new Date(),
        });
      }
    }
    logger.info(`✅ Migrated ${users.length} users`);

    // Migrate Alerts
    logger.info('🚨 Migrating alerts...');
    const alerts = await Alert.find({}).lean();
    for (const alert of alerts) {
      const existingAlert = await AppDataSource.getRepository(AlertEntity).findOne({ where: { id: alert._id.toString() } });
      if (!existingAlert) {
        await AppDataSource.getRepository(AlertEntity).save({
          id: alert._id.toString(),
          name: alert.name || '',
          description: (alert as any).description || '',
          teamId: alert.team.toString(),
          savedSearchId: (alert as any).savedSearch?.toString(),
          source: ((alert as any).source || 'logs') as 'logs' | 'traces' | 'metrics',
          type: ((alert as any).type || 'count') as 'count' | 'percentile' | 'custom',
          query: (alert as any).query || {},
          operator: ((alert as any).operator || 'gt') as 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne',
          threshold: (alert as any).threshold || 0,
          windowSizeInMinutes: (alert as any).windowSizeInMinutes || 5,
          isEnabled: (alert as any).isEnabled !== false,
          channels: (alert as any).channels || [],
          lastTriggeredAt: (alert as any).lastTriggeredAt || null,
          triggerCount: (alert as any).triggerCount || 0,
          createdAt: (alert as any).createdAt || new Date(),
          updatedAt: (alert as any).updatedAt || new Date(),
        });
      }
    }
    logger.info(`✅ Migrated ${alerts.length} alerts`);

    // Migrate Saved Searches
    logger.info('🔍 Migrating saved searches...');
    const savedSearches = await SavedSearch.find({}).lean();
    for (const search of savedSearches) {
      const existingSearch = await AppDataSource.getRepository(SavedSearchEntity).findOne({ where: { id: search._id.toString() } });
      if (!existingSearch) {
        await AppDataSource.getRepository(SavedSearchEntity).save({
          id: search._id.toString(),
          name: search.name,
          description: (search as any).description || '',
          teamId: search.team.toString(),
          source: (search as any).source || 'logs',
          query: (search as any).query || '',
          filters: (search as any).filters || {},
          isDefault: (search as any).isDefault || false,
          isPublic: (search as any).isPublic !== false,
          createdById: (search as any).createdBy?.toString(),
          createdAt: (search as any).createdAt || new Date(),
          updatedAt: (search as any).updatedAt || new Date(),
        });
      }
    }
    logger.info(`✅ Migrated ${savedSearches.length} saved searches`);

    // Migrate Dashboards
    logger.info('📊 Migrating dashboards...');
    const dashboards = await Dashboard.find({}).lean();
    for (const dashboard of dashboards) {
      const existingDashboard = await AppDataSource.getRepository(DashboardEntity).findOne({ where: { id: dashboard._id.toString() } });
      if (!existingDashboard) {
        await AppDataSource.getRepository(DashboardEntity).save({
          id: dashboard._id.toString(),
          name: dashboard.name,
          description: (dashboard as any).description || '',
          teamId: dashboard.team.toString(),
          tiles: (dashboard as any).tiles || [],
          isDefault: (dashboard as any).isDefault || false,
          isPublic: (dashboard as any).isPublic !== false,
          createdById: (dashboard as any).createdBy?.toString(),
          createdAt: (dashboard as any).createdAt || new Date(),
          updatedAt: (dashboard as any).updatedAt || new Date(),
        });
      }
    }
    logger.info(`✅ Migrated ${dashboards.length} dashboards`);

    // Migrate Sources
    logger.info('📡 Migrating sources...');
    const sources = await Source.find({}).lean();
    for (const source of sources) {
      const existingSource = await AppDataSource.getRepository(SourceEntity).findOne({ where: { id: source._id.toString() } });
      if (!existingSource) {
        await AppDataSource.getRepository(SourceEntity).save({
          id: source._id.toString(),
          name: source.name,
          description: (source as any).description || '',
          teamId: source.team.toString(),
          type: (source as any).type || 'logs',
          config: (source as any).config || {},
          isEnabled: (source as any).isEnabled !== false,
          lastIngestionAt: (source as any).lastIngestionAt || null,
          ingestionCount: (source as any).ingestionCount || 0,
          createdAt: (source as any).createdAt || new Date(),
          updatedAt: (source as any).updatedAt || new Date(),
        });
      }
    }
    logger.info(`✅ Migrated ${sources.length} sources`);

    // Migrate Webhooks
    logger.info('🔗 Migrating webhooks...');
    const webhooks = await Webhook.find({}).lean();
    for (const webhook of webhooks) {
      const existingWebhook = await AppDataSource.getRepository(WebhookEntity).findOne({ where: { id: webhook._id.toString() } });
      if (!existingWebhook) {
        await AppDataSource.getRepository(WebhookEntity).save({
          id: webhook._id.toString(),
          name: webhook.name,
          description: webhook.description,
          teamId: webhook.team.toString(),
          url: webhook.url,
          method: (webhook as any).method || 'POST',
          headers: (webhook as any).headers || {},
          events: (webhook as any).events || [],
          isEnabled: (webhook as any).isEnabled !== false,
          lastTriggeredAt: (webhook as any).lastTriggeredAt || null,
          triggerCount: (webhook as any).triggerCount || 0,
          errorCount: (webhook as any).errorCount || 0,
          createdAt: (webhook as any).createdAt || new Date(),
          updatedAt: (webhook as any).updatedAt || new Date(),
        });
      }
    }
    logger.info(`✅ Migrated ${webhooks.length} webhooks`);

    // Migrate Team Invites
    logger.info('📧 Migrating team invites...');
    const teamInvites = await TeamInvite.find({}).lean();
    for (const invite of teamInvites) {
      const existingInvite = await AppDataSource.getRepository(TeamInviteEntity).findOne({ where: { id: invite._id.toString() } });
      if (!existingInvite) {
        await AppDataSource.getRepository(TeamInviteEntity).save({
          id: invite._id.toString(),
          email: invite.email,
          teamId: (invite as any).team?.toString() || '',
          token: (invite as any).token || '',
          status: (invite as any).status || 'pending',
          expiresAt: (invite as any).expiresAt || null,
          invitedById: (invite as any).invitedBy?.toString(),
          acceptedById: (invite as any).acceptedBy?.toString(),
          acceptedAt: (invite as any).acceptedAt || null,
          createdAt: (invite as any).createdAt || new Date(),
          updatedAt: (invite as any).updatedAt || new Date(),
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
