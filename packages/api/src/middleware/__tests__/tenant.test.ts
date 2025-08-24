import { Request, Response, NextFunction } from 'express';
import { 
  tenantMiddleware, 
  apiKeyTenantMiddleware,
  extractTenantFromAuth,
  TenantRequest 
} from '../tenant';
import Team from '@/models/team';

// Mock dependencies
jest.mock('@/models/team');
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Tenant Middleware', () => {
  let req: Partial<TenantRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'GET'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('extractTenantFromAuth', () => {
    it('should extract tenant from valid JWT', async () => {
      // Create a mock JWT payload
      const payload = {
        tenant_id: 'tenant-123',
        user_id: 'user-456',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000)
      };
      
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      const authToken = `Bearer ${token}`;
      
      const result = await extractTenantFromAuth(authToken);
      
      expect(result).toEqual({
        id: 'tenant-123',
        name: 'Tenant tenant-123'
      });
    });

    it('should return null for missing auth token', async () => {
      const result = await extractTenantFromAuth();
      expect(result).toBeNull();
    });

    it('should return null for expired JWT', async () => {
      const payload = {
        tenant_id: 'tenant-123',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200
      };
      
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      const authToken = `Bearer ${token}`;
      
      const result = await extractTenantFromAuth(authToken);
      expect(result).toBeNull();
    });

    it('should return null for invalid JWT format', async () => {
      const result = await extractTenantFromAuth('Bearer invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('tenantMiddleware', () => {
    it('should attach tenant context for valid authentication', async () => {
      // Mock JWT payload
      const payload = {
        tenant_id: 'tenant-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };
      
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      req.headers = { authorization: `Bearer ${token}` };

      // Mock Team.findOne
      const mockTeam = {
        _id: 'team-id-123',
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
        name: 'Test Team'
      };
      (Team.findOne as jest.Mock).mockResolvedValueOnce(mockTeam);

      await tenantMiddleware(req as TenantRequest, res as Response, next);

      expect(req.tenant).toEqual({
        id: 'tenant-123',
        name: 'Tenant tenant-123',
        team: mockTeam
      });
      expect(next).toHaveBeenCalled();
      expect(Team.findOne).toHaveBeenCalledWith({ tenantId: 'tenant-123' });
    });

    it('should reject request with invalid tenant context', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };

      await tenantMiddleware(req as TenantRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid tenant context',
        message: 'Authentication required with valid tenant information'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when tenant not found in database', async () => {
      const payload = {
        tenant_id: 'tenant-404',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };
      
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      req.headers = { authorization: `Bearer ${token}` };

      // Mock Team.findOne returning null
      (Team.findOne as jest.Mock).mockResolvedValueOnce(null);

      await tenantMiddleware(req as TenantRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tenant not found',
        message: 'Tenant is not registered in the system'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle middleware errors gracefully', async () => {
      req.headers = { authorization: 'Bearer valid-token' };
      
      // Mock Team.findOne throwing error
      (Team.findOne as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await tenantMiddleware(req as TenantRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication error',
        message: 'Internal server error during authentication'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('apiKeyTenantMiddleware', () => {
    it('should authenticate with valid API key', async () => {
      req.headers = { 'x-api-key': 'valid-api-key-123' };

      const mockTeam = {
        _id: 'team-id-123',
        tenantId: 'tenant-123',
        tenantName: 'API Test Tenant',
        apiKey: 'valid-api-key-123'
      };
      (Team.findOne as jest.Mock).mockResolvedValueOnce(mockTeam);

      await apiKeyTenantMiddleware(req as TenantRequest, res as Response, next);

      expect(req.tenant).toEqual({
        id: 'tenant-123',
        name: 'API Test Tenant',
        team: mockTeam
      });
      expect(next).toHaveBeenCalled();
      expect(Team.findOne).toHaveBeenCalledWith({ apiKey: 'valid-api-key-123' });
    });

    it('should reject request without API key', async () => {
      await apiKeyTenantMiddleware(req as TenantRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'API key required',
        message: 'Valid API key must be provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid API key', async () => {
      req.headers = { 'x-api-key': 'invalid-api-key' };
      
      // Mock Team.findOne returning null
      (Team.findOne as jest.Mock).mockResolvedValueOnce(null);

      await apiKeyTenantMiddleware(req as TenantRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid API key',
        message: 'API key is not valid'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should authenticate with API key from query parameter', async () => {
      req.query = { apiKey: 'query-api-key-123' };

      const mockTeam = {
        _id: 'team-id-456',
        tenantId: 'tenant-456',
        tenantName: 'Query API Tenant',
        apiKey: 'query-api-key-123'
      };
      (Team.findOne as jest.Mock).mockResolvedValueOnce(mockTeam);

      await apiKeyTenantMiddleware(req as TenantRequest, res as Response, next);

      expect(req.tenant).toEqual({
        id: 'tenant-456',
        name: 'Query API Tenant',
        team: mockTeam
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JWT gracefully', async () => {
      req.headers = { authorization: 'Bearer malformed.jwt' };

      await tenantMiddleware(req as TenantRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const payload = {
        tenant_id: 'tenant-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };
      
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      req.headers = { authorization: `Bearer ${token}` };

      (Team.findOne as jest.Mock).mockRejectedValueOnce(new Error('Connection timeout'));

      await tenantMiddleware(req as TenantRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication error',
        message: 'Internal server error during authentication'
      });
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in error responses', async () => {
      req.headers = { authorization: 'Bearer some-token' };

      await tenantMiddleware(req as TenantRequest, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          token: expect.anything(),
          payload: expect.anything(),
          internalError: expect.anything()
        })
      );
    });

    it('should log security events for audit', async () => {
      const mockLogger = require('@/utils/logger').logger;
      
      req.headers = { authorization: 'Bearer invalid-token' };

      await tenantMiddleware(req as TenantRequest, res as Response, next);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Request rejected - no valid tenant context',
        expect.objectContaining({
          ip: '127.0.0.1',
          path: '/api/test'
        })
      );
    });
  });
});