import { Request } from 'express';
import { logger } from '@/utils/logger';
import { TenantRequest } from '@/middleware/tenant';

// Utility functions for tenant context management

/**
 * Extract tenant ID from request context
 */
export const getTenantId = (req: TenantRequest): string => {
  if (!req.tenant) {
    throw new Error('Tenant context not found in request');
  }
  return req.tenant.id;
};

/**
 * Extract tenant ID safely with fallback
 */
export const getTenantIdSafe = (req: TenantRequest, fallback: string = 'default'): string => {
  try {
    return getTenantId(req);
  } catch (error) {
    logger.warn('Failed to get tenant ID, using fallback', { 
      fallback,
      error: error.message 
    });
    return fallback;
  }
};

/**
 * Validate tenant access to a resource
 */
export const validateTenantAccess = (req: TenantRequest, resourceTenantId: string): boolean => {
  const requestTenantId = getTenantIdSafe(req);
  
  if (requestTenantId !== resourceTenantId) {
    logger.warn('Cross-tenant access attempt blocked', {
      requestTenantId,
      resourceTenantId,
      ip: req.ip,
      path: req.path
    });
    return false;
  }
  
  return true;
};

/**
 * Create audit log entry for tenant actions
 */
export const auditTenantAction = (
  req: TenantRequest,
  action: string,
  resource: string,
  metadata?: Record<string, any>
) => {
  const tenantId = getTenantIdSafe(req);
  
  logger.info('Tenant action audit', {
    tenantId,
    action,
    resource,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

/**
 * Check tenant feature permissions
 */
export const checkTenantFeature = (req: TenantRequest, feature: keyof NonNullable<any>['featuresEnabled']): boolean => {
  if (!req.tenant?.team?.featuresEnabled) {
    return true; // Default to enabled if no feature flags set
  }
  
  const isEnabled = req.tenant.team.featuresEnabled[feature];
  
  if (!isEnabled) {
    logger.info('Tenant feature access denied', {
      tenantId: req.tenant.id,
      feature,
      path: req.path
    });
  }
  
  return isEnabled !== false; // Default to true if undefined
};

/**
 * Get tenant-specific configuration
 */
export const getTenantConfig = (req: TenantRequest) => {
  if (!req.tenant?.team) {
    return null;
  }
  
  const { team } = req.tenant;
  
  return {
    tenantId: req.tenant.id,
    tenantName: req.tenant.name,
    dataRetentionDays: team.dataRetentionDays || 30,
    maxUsersPerTenant: team.maxUsersPerTenant || 10,
    allowedIngestionRate: team.allowedIngestionRate || 10000,
    storageQuotaGB: team.storageQuotaGB || 10,
    featuresEnabled: team.featuresEnabled || {},
    searchRowLimit: team.searchRowLimit || 1000,
    metadataMaxRowsToRead: team.metadataMaxRowsToRead || 10000
  };
};

/**
 * Validate tenant quota usage
 */
export const validateTenantQuota = async (
  req: TenantRequest,
  quotaType: 'storage' | 'ingestion' | 'users',
  currentUsage: number
): Promise<{ allowed: boolean; limit: number; usage: number }> => {
  const config = getTenantConfig(req);
  
  if (!config) {
    return { allowed: true, limit: Infinity, usage: currentUsage };
  }
  
  let limit: number;
  
  switch (quotaType) {
    case 'storage':
      limit = config.storageQuotaGB * 1024 * 1024 * 1024; // Convert GB to bytes
      break;
    case 'ingestion':
      limit = config.allowedIngestionRate;
      break;
    case 'users':
      limit = config.maxUsersPerTenant;
      break;
    default:
      limit = Infinity;
  }
  
  const allowed = currentUsage < limit;
  
  if (!allowed) {
    logger.warn('Tenant quota exceeded', {
      tenantId: config.tenantId,
      quotaType,
      limit,
      currentUsage,
      path: req.path
    });
    
    auditTenantAction(req, 'quota_exceeded', quotaType, {
      limit,
      currentUsage
    });
  }
  
  return { allowed, limit, usage: currentUsage };
};

/**
 * Sanitize data for cross-tenant safety
 */
export const sanitizeForTenant = <T extends Record<string, any>>(
  data: T,
  tenantId: string
): T & { tenant_id: string } => {
  return {
    ...data,
    tenant_id: tenantId
  };
};

/**
 * Filter array of objects by tenant
 */
export const filterByTenant = <T extends { tenant_id?: string }>(
  items: T[],
  tenantId: string
): T[] => {
  return items.filter(item => item.tenant_id === tenantId);
};

/**
 * Create tenant-scoped error response
 */
export const createTenantError = (
  message: string,
  code: string = 'TENANT_ERROR',
  statusCode: number = 400
) => {
  return {
    error: code,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Middleware helper for tenant validation
 */
export const withTenantValidation = (
  handler: (req: TenantRequest, res: any, next: any) => void
) => {
  return (req: TenantRequest, res: any, next: any) => {
    if (!req.tenant) {
      return res.status(403).json(
        createTenantError('Tenant context required', 'MISSING_TENANT_CONTEXT', 403)
      );
    }
    
    return handler(req, res, next);
  };
};