import { Request } from 'express';
import { userService } from './UserService';
import { teamService } from './TeamService';
import { alertService } from './AlertService';
import { getCurrentTenant, getCurrentTeamId } from '@/middleware/tenant';
import logger from '@/utils/logger';

export class MultiTenantService {
  /**
   * Get all users for the current tenant
   */
  async getTenantUsers(req: Request) {
    const tenant = getCurrentTenant(req);
    if (!tenant) {
      throw new Error('Tenant context required');
    }

    return userService.findByTeamId(tenant.teamId);
  }

  /**
   * Get all alerts for the current tenant
   */
  async getTenantAlerts(req: Request) {
    const tenant = getCurrentTenant(req);
    if (!tenant) {
      throw new Error('Tenant context required');
    }

    return alertService.findByTeamId(tenant.teamId);
  }

  /**
   * Create a user within the current tenant context
   */
  async createTenantUser(req: Request, userData: {
    email: string;
    password?: string;
    name: string;
    isAdmin?: boolean;
    avatar?: string;
  }) {
    const tenant = getCurrentTenant(req);
    if (!tenant) {
      throw new Error('Tenant context required');
    }

    // Check if user already exists in this tenant
    const existingUser = await userService.findByEmail(userData.email);
    if (existingUser && existingUser.teamId === tenant.teamId) {
      throw new Error('User already exists in this tenant');
    }

    return userService.createUser({
      ...userData,
      teamId: tenant.teamId,
    });
  }

  /**
   * Create an alert within the current tenant context
   */
  async createTenantAlert(req: Request, alertData: {
    name: string;
    source: 'logs' | 'traces' | 'metrics';
    type: 'count' | 'percentile' | 'custom';
    query: Record<string, any>;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    threshold: number;
    windowSizeInMinutes: number;
    dashboardId?: string;
    savedSearchId?: string;
    channels?: Array<{
      type: 'webhook' | 'slack' | 'email';
      config: Record<string, any>;
    }>;
  }) {
    const tenant = getCurrentTenant(req);
    if (!tenant) {
      throw new Error('Tenant context required');
    }

    return alertService.createAlert({
      ...alertData,
      teamId: tenant.teamId,
    });
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(req: Request) {
    const tenant = getCurrentTenant(req);
    if (!tenant) {
      throw new Error('Tenant context required');
    }

    const [users, alerts, team] = await Promise.all([
      userService.findByTeamId(tenant.teamId),
      alertService.findByTeamId(tenant.teamId),
      teamService.findById(tenant.teamId),
    ]);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        teamId: tenant.teamId,
      },
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        totalAlerts: alerts.length,
        enabledAlerts: alerts.filter(a => a.isEnabled).length,
        dataRetentionDays: team?.dataRetentionDays || 30,
        maxUsersPerTenant: team?.maxUsersPerTenant || 10,
        allowedIngestionRate: team?.allowedIngestionRate || 10000,
        storageQuotaGB: team?.storageQuotaGB || 10,
      },
    };
  }

  /**
   * Validate tenant access to a resource
   */
  async validateTenantAccess(req: Request, resourceType: 'user' | 'alert', resourceId: string) {
    const tenant = getCurrentTenant(req);
    if (!tenant) {
      throw new Error('Tenant context required');
    }

    let resource;
    switch (resourceType) {
      case 'user':
        resource = await userService.findById(resourceId);
        break;
      case 'alert':
        resource = await alertService.findById(resourceId);
        break;
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    if (!resource) {
      throw new Error(`${resourceType} not found`);
    }

    if (resource.teamId !== tenant.teamId) {
      logger.warn('Tenant access violation', {
        tenantId: tenant.id,
        resourceType,
        resourceId,
        resourceTeamId: resource.teamId,
      });
      throw new Error('Access denied: resource belongs to different tenant');
    }

    return resource;
  }

  /**
   * Get tenant configuration
   */
  async getTenantConfig(req: Request) {
    const tenant = getCurrentTenant(req);
    if (!tenant) {
      throw new Error('Tenant context required');
    }

    const team = await teamService.findById(tenant.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        teamId: tenant.teamId,
      },
      config: {
        dataRetentionDays: team.dataRetentionDays,
        maxUsersPerTenant: team.maxUsersPerTenant,
        allowedIngestionRate: team.allowedIngestionRate,
        storageQuotaGB: team.storageQuotaGB,
        featuresEnabled: team.featuresEnabled,
        clickstackSettings: team.clickstackSettings,
        collectorAuthenticationEnforced: team.collectorAuthenticationEnforced,
      },
    };
  }
}

// Export singleton instance
export const multiTenantService = new MultiTenantService();
