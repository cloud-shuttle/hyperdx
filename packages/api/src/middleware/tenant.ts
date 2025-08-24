import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Team from '@/models/team';
import { logger } from '@/utils/logger';

// Extend Request interface for tenant context
export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    team: any; // MongoDB team document
  };
}

// Validation schemas
const JWTPayloadSchema = z.object({
  tenant_id: z.string(),
  user_id: z.string().optional(),
  exp: z.number(),
  iat: z.number(),
});

// Mock auth service integration (replace with your actual auth service)
export const extractTenantFromAuth = async (authToken?: string): Promise<{ id: string; name: string } | null> => {
  if (!authToken) {
    return null;
  }

  try {
    // Remove 'Bearer ' prefix
    const token = authToken.replace(/^Bearer\s+/, '');
    
    // For demo purposes, we'll decode the JWT payload manually
    // In production, you should verify the signature with your auth service
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    // Validate payload structure
    const validatedPayload = JWTPayloadSchema.parse(payload);
    
    // Check token expiration
    if (validatedPayload.exp < Date.now() / 1000) {
      logger.warn('Expired JWT token', { exp: validatedPayload.exp });
      return null;
    }
    
    // TODO: Replace this with actual auth service call
    // const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': authToken,
    //     'Content-Type': 'application/json'
    //   }
    // });
    
    // For now, extract tenant from JWT payload
    return {
      id: validatedPayload.tenant_id,
      name: `Tenant ${validatedPayload.tenant_id}` // This should come from auth service
    };
    
  } catch (error) {
    logger.error('Failed to extract tenant from auth token', { error: error.message });
    return null;
  }
};

// Tenant middleware function
export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract tenant from authorization header
    const authToken = req.headers.authorization;
    const tenant = await extractTenantFromAuth(authToken);
    
    if (!tenant) {
      logger.warn('Request rejected - no valid tenant context', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      return res.status(403).json({ 
        error: 'Invalid tenant context',
        message: 'Authentication required with valid tenant information'
      });
    }

    // Find the team/organization for this tenant
    const team = await Team.findOne({ tenantId: tenant.id });
    
    if (!team) {
      logger.warn('Request rejected - tenant not found in database', {
        tenantId: tenant.id,
        path: req.path
      });
      
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'Tenant is not registered in the system'
      });
    }

    // Attach tenant context to request
    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      team: team
    };

    // Log tenant access for audit purposes
    logger.info('Tenant access granted', {
      tenantId: tenant.id,
      tenantName: tenant.name,
      teamId: team._id,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    next();
    
  } catch (error) {
    logger.error('Tenant middleware error', { 
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

// Optional middleware for API key-based authentication (for OTEL ingestion)
export const apiKeyTenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for API key in header or query parameter
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(401).json({
        error: 'API key required',
        message: 'Valid API key must be provided'
      });
    }

    // Find team by API key
    const team = await Team.findOne({ apiKey });
    
    if (!team) {
      logger.warn('Invalid API key used', {
        apiKey: apiKey.substring(0, 8) + '...',
        ip: req.ip,
        path: req.path
      });
      
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'API key is not valid'
      });
    }

    // Attach tenant context based on team
    req.tenant = {
      id: team.tenantId,
      name: team.tenantName || `Tenant ${team.tenantId}`,
      team: team
    };

    logger.info('API key tenant access granted', {
      tenantId: team.tenantId,
      teamId: team._id,
      path: req.path,
      method: req.method
    });

    next();
    
  } catch (error) {
    logger.error('API key tenant middleware error', { 
      error: error.message,
      path: req.path
    });
    
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during API key validation'
    });
  }
};

// Middleware to enforce tenant-specific rate limits
export const tenantRateLimitMiddleware = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  // Implementation would depend on your rate limiting strategy
  // This is a placeholder for tenant-specific rate limiting
  
  if (!req.tenant) {
    return next();
  }

  const { team } = req.tenant;
  
  // Check tenant-specific rate limits
  if (team.allowedIngestionRate && req.path.includes('/ingest')) {
    // Implement rate limiting logic here
    // For now, we'll just log the limit
    logger.debug('Checking ingestion rate limit', {
      tenantId: req.tenant.id,
      allowedRate: team.allowedIngestionRate
    });
  }

  next();
};

// Utility function to get tenant context from request
export const getTenantContext = (req: TenantRequest) => {
  return req.tenant;
};

// Utility function to ensure tenant context exists
export const requireTenantContext = (req: TenantRequest): req is TenantRequest & { tenant: NonNullable<TenantRequest['tenant']> } => {
  return req.tenant !== undefined;
};