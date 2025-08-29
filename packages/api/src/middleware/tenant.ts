import { Request, Response, NextFunction } from 'express';
import { teamService } from '@/services/TeamService';
import logger from '@/utils/logger';

// Extend Request interface to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        teamId: string;
      };
    }
  }
}

export async function setTenantContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get tenant from various sources (API key, user session, etc.)
    const tenantId = getTenantIdFromRequest(req);
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context required' });
    }

    // Get tenant/team information
    const team = await teamService.findByTenantId(tenantId);
    if (!team) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Set tenant context
    req.tenant = {
      id: team.tenantId,
      name: team.tenantName || team.name,
      teamId: team.id,
    };

    logger.debug(`Tenant context set: ${team.tenantId} (${team.name})`);
    next();
  } catch (error) {
    logger.error('Error setting tenant context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.tenant) {
    return res.status(401).json({ error: 'Tenant context required' });
  }
  next();
}

export function getTenantIdFromRequest(req: Request): string | null {
  // Try to get tenant ID from various sources
  
  // 1. From API key in headers
  const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  if (apiKey) {
    // TODO: Implement API key to tenant mapping
    return null;
  }

  // 2. From user session (if authenticated)
  if (req.user?.team) {
    return req.user.team.toString();
  }

  // 3. From query parameters (for development/testing)
  if (req.query.tenantId) {
    return req.query.tenantId as string;
  }

  // 4. From subdomain (if using subdomain-based tenancy)
  const hostname = req.hostname;
  if (hostname.includes('.')) {
    const subdomain = hostname.split('.')[0];
    if (subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }
  }

  return null;
}

export function getCurrentTenant(req: Request) {
  return req.tenant;
}

export function getCurrentTeamId(req: Request): string {
  if (!req.tenant) {
    throw new Error('Tenant context not available');
  }
  return req.tenant.teamId;
}