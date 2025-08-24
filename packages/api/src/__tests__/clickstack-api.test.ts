import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the ClickStack services
jest.mock('@/services/clickstack');
jest.mock('@/services/clickstackDashboard');
jest.mock('@/services/clickstackSearch');
jest.mock('@/services/clickstackSession');
jest.mock('@/services/clickstackPattern');
jest.mock('@/services/clickstackEventDelta');

import clickstackRouter from '@/routers/api/clickstack';
import { ClickStackService } from '@/services/clickstack';
import { ClickStackDashboardService } from '@/services/clickstackDashboard';

describe('ClickStack API', () => {
  let app: express.Application;
  let mockClickStackService: jest.Mocked<ClickStackService>;
  let mockClickStackDashboardService: jest.Mocked<ClickStackDashboardService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { teamId: 'test-team-id', userId: 'test-user-id' };
      next();
    });
    
    app.use('/clickstack', clickstackRouter);

    // Setup service mocks
    mockClickStackService = {
      getHealth: jest.fn(),
      getFeatures: jest.fn(),
      getCorrelatedData: jest.fn(),
      getMetadata: jest.fn(),
      updateMetadata: jest.fn(),
      validateConfiguration: jest.fn(),
    } as any;

    mockClickStackDashboardService = {
      getOverview: jest.fn(),
      getMetrics: jest.fn(),
      getSessions: jest.fn(),
      getPatterns: jest.fn(),
      getEventDeltas: jest.fn(),
    } as any;

    // Mock service instances
    (ClickStackService.getInstance as jest.Mock).mockReturnValue(mockClickStackService);
    (ClickStackDashboardService.getInstance as jest.Mock).mockReturnValue(mockClickStackDashboardService);
  });

  describe('GET /clickstack/health', () => {
    it('should return ClickStack health status', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        version: '1.0',
        features: {
          sessionReplay: true,
          patternRecognition: true,
          eventDeltaAnalysis: true,
        },
        metrics: {
          totalSessions: 100,
          totalPatterns: 50,
          totalEventDeltas: 25,
          lastIngestionTime: '2024-01-01T00:00:00Z',
        },
        errors: [],
      };

      mockClickStackService.getHealth.mockResolvedValue(mockHealth);

      const response = await request(app)
        .get('/clickstack/health')
        .expect(200);

      expect(response.body).toEqual(mockHealth);
      expect(mockClickStackService.getHealth).toHaveBeenCalledWith('test-team-id');
    });

    it('should handle service errors', async () => {
      mockClickStackService.getHealth.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/clickstack/health')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /clickstack/features', () => {
    it('should return ClickStack features status', async () => {
      const mockFeatures = {
        sessionReplay: {
          enabled: true,
          version: '1.0',
          settings: { captureEvents: true },
        },
        patternRecognition: {
          enabled: true,
          version: '1.0',
          settings: { confidence: 0.8 },
        },
        eventDeltaAnalysis: {
          enabled: true,
          version: '1.0',
          settings: { threshold: 10.0 },
        },
      };

      mockClickStackService.getFeatures.mockResolvedValue(mockFeatures);

      const response = await request(app)
        .get('/clickstack/features')
        .expect(200);

      expect(response.body).toEqual(mockFeatures);
      expect(mockClickStackService.getFeatures).toHaveBeenCalledWith('test-team-id');
    });
  });

  describe('GET /clickstack/dashboard/overview', () => {
    it('should return dashboard overview', async () => {
      const mockOverview = {
        totalSessions: 100,
        totalPatterns: 50,
        totalEventDeltas: 25,
        activeUsers: 25,
        topPages: [
          { pageUrl: '/home', count: 20 },
          { pageUrl: '/dashboard', count: 15 },
        ],
        topPatterns: [
          { patternType: 'error', count: 10 },
          { patternType: 'warning', count: 5 },
        ],
        recentActivity: [
          { timestamp: '2024-01-01T00:00:00Z', type: 'session', description: 'New session on /home' },
        ],
        healthStatus: 'healthy' as const,
      };

      mockClickStackDashboardService.getOverview.mockResolvedValue(mockOverview);

      const response = await request(app)
        .get('/clickstack/dashboard/overview')
        .query({ startTime: '2024-01-01T00:00:00Z', endTime: '2024-01-02T00:00:00Z' })
        .expect(200);

      expect(response.body).toEqual(mockOverview);
      expect(mockClickStackDashboardService.getOverview).toHaveBeenCalledWith(
        'test-team-id',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z'
      );
    });
  });

  describe('GET /clickstack/dashboard/metrics', () => {
    it('should return dashboard metrics', async () => {
      const mockMetrics = {
        sessions: {
          total: 100,
          active: 25,
          new: 10,
          trend: [
            { timestamp: '2024-01-01T00:00:00Z', count: 5 },
            { timestamp: '2024-01-01T01:00:00Z', count: 8 },
          ],
        },
        patterns: {
          total: 50,
          highConfidence: 30,
          new: 5,
          trend: [
            { timestamp: '2024-01-01T00:00:00Z', count: 2 },
            { timestamp: '2024-01-01T01:00:00Z', count: 3 },
          ],
        },
        eventDeltas: {
          total: 25,
          anomalies: 5,
          new: 2,
          trend: [
            { timestamp: '2024-01-01T00:00:00Z', count: 1 },
            { timestamp: '2024-01-01T01:00:00Z', count: 1 },
          ],
        },
        performance: {
          avgSessionDuration: 300,
          avgPatternConfidence: 0.85,
          avgDeltaPercent: 5.5,
        },
      };

      mockClickStackDashboardService.getMetrics.mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/clickstack/dashboard/metrics')
        .query({ 
          startTime: '2024-01-01T00:00:00Z', 
          endTime: '2024-01-02T00:00:00Z',
          metricType: 'sessions'
        })
        .expect(200);

      expect(response.body).toEqual(mockMetrics);
      expect(mockClickStackDashboardService.getMetrics).toHaveBeenCalledWith(
        'test-team-id',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z',
        'sessions'
      );
    });
  });

  describe('GET /clickstack/dashboard/sessions', () => {
    it('should return dashboard sessions', async () => {
      const mockSessions = [
        {
          sessionId: 'session-1',
          userId: 'user-1',
          pageUrl: '/home',
          viewport: { width: 1920, height: 1080 },
          userAgent: 'Mozilla/5.0...',
          events: ['click', 'scroll'],
          timestamp: '2024-01-01T00:00:00Z',
          duration: 300,
          eventCount: 10,
        },
      ];

      mockClickStackDashboardService.getSessions.mockResolvedValue(mockSessions);

      const response = await request(app)
        .get('/clickstack/dashboard/sessions')
        .query({ 
          startTime: '2024-01-01T00:00:00Z', 
          endTime: '2024-01-02T00:00:00Z',
          limit: '25'
        })
        .expect(200);

      expect(response.body).toEqual(mockSessions);
      expect(mockClickStackDashboardService.getSessions).toHaveBeenCalledWith(
        'test-team-id',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z',
        25
      );
    });
  });

  describe('GET /clickstack/dashboard/patterns', () => {
    it('should return dashboard patterns', async () => {
      const mockPatterns = [
        {
          patternId: 'pattern-1',
          patternType: 'error',
          confidence: 0.95,
          occurrences: 10,
          timestamp: '2024-01-01T00:00:00Z',
          metadata: { severity: 'high' },
        },
      ];

      mockClickStackDashboardService.getPatterns.mockResolvedValue(mockPatterns);

      const response = await request(app)
        .get('/clickstack/dashboard/patterns')
        .query({ 
          startTime: '2024-01-01T00:00:00Z', 
          endTime: '2024-01-02T00:00:00Z',
          confidence: '0.8'
        })
        .expect(200);

      expect(response.body).toEqual(mockPatterns);
      expect(mockClickStackDashboardService.getPatterns).toHaveBeenCalledWith(
        'test-team-id',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z',
        0.8
      );
    });
  });

  describe('GET /clickstack/dashboard/event-deltas', () => {
    it('should return dashboard event deltas', async () => {
      const mockEventDeltas = [
        {
          baseline: 100,
          current: 120,
          deltaPercent: 20.0,
          timestamp: '2024-01-01T00:00:00Z',
          metadata: { metric: 'response_time' },
        },
      ];

      mockClickStackDashboardService.getEventDeltas.mockResolvedValue(mockEventDeltas);

      const response = await request(app)
        .get('/clickstack/dashboard/event-deltas')
        .query({ 
          startTime: '2024-01-01T00:00:00Z', 
          endTime: '2024-01-02T00:00:00Z',
          threshold: '10.0'
        })
        .expect(200);

      expect(response.body).toEqual(mockEventDeltas);
      expect(mockClickStackDashboardService.getEventDeltas).toHaveBeenCalledWith(
        'test-team-id',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z',
        10.0
      );
    });
  });

  describe('POST /clickstack/search', () => {
    it('should search ClickStack data', async () => {
      const searchRequest = {
        query: 'error',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-02T00:00:00Z',
        filters: { severity: 'high' },
        limit: 100,
        offset: 0,
      };

      const mockResults = {
        logs: [{ id: 'log-1', body: 'Error occurred' }],
        traces: [{ id: 'trace-1', span_name: 'error_handler' }],
        metrics: [{ id: 'metric-1', metric_name: 'error_rate' }],
        total: 3,
      };

      // Mock the search service
      const mockSearchService = {
        search: jest.fn().mockResolvedValue(mockResults),
      };
      jest.doMock('@/services/clickstackSearch', () => ({
        ClickStackSearchService: {
          getInstance: jest.fn().mockReturnValue(mockSearchService),
        },
      }));

      const response = await request(app)
        .post('/clickstack/search')
        .send(searchRequest)
        .expect(200);

      expect(response.body).toEqual(mockResults);
    });

    it('should validate search request body', async () => {
      const invalidRequest = {
        // Missing required query field
        startTime: '2024-01-01T00:00:00Z',
      };

      await request(app)
        .post('/clickstack/search')
        .send(invalidRequest)
        .expect(400);
    });
  });

  describe('GET /clickstack/sessions/:sessionId', () => {
    it('should return session by ID', async () => {
      const mockSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        pageUrl: '/home',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0...',
        events: ['click', 'scroll'],
        timestamp: '2024-01-01T00:00:00Z',
      };

      // Mock the session service
      const mockSessionService = {
        getSession: jest.fn().mockResolvedValue(mockSession),
      };
      jest.doMock('@/services/clickstackSession', () => ({
        ClickStackSessionService: {
          getInstance: jest.fn().mockReturnValue(mockSessionService),
        },
      }));

      const response = await request(app)
        .get('/clickstack/sessions/session-1')
        .expect(200);

      expect(response.body).toEqual(mockSession);
    });

    it('should return 404 for non-existent session', async () => {
      // Mock the session service
      const mockSessionService = {
        getSession: jest.fn().mockResolvedValue(null),
      };
      jest.doMock('@/services/clickstackSession', () => ({
        ClickStackSessionService: {
          getInstance: jest.fn().mockReturnValue(mockSessionService),
        },
      }));

      await request(app)
        .get('/clickstack/sessions/non-existent')
        .expect(404);
    });
  });

  describe('GET /clickstack/patterns/:patternId', () => {
    it('should return pattern by ID', async () => {
      const mockPattern = {
        patternId: 'pattern-1',
        patternType: 'error',
        confidence: 0.95,
        occurrences: 10,
        timestamp: '2024-01-01T00:00:00Z',
        metadata: { severity: 'high' },
      };

      // Mock the pattern service
      const mockPatternService = {
        getPattern: jest.fn().mockResolvedValue(mockPattern),
      };
      jest.doMock('@/services/clickstackPattern', () => ({
        ClickStackPatternService: {
          getInstance: jest.fn().mockReturnValue(mockPatternService),
        },
      }));

      const response = await request(app)
        .get('/clickstack/patterns/pattern-1')
        .expect(200);

      expect(response.body).toEqual(mockPattern);
    });
  });

  describe('GET /clickstack/correlations/:correlationId', () => {
    it('should return correlated data', async () => {
      const mockCorrelatedData = {
        correlationId: 'corr-1',
        logs: [{ id: 'log-1', body: 'Error occurred' }],
        traces: [{ id: 'trace-1', span_name: 'error_handler' }],
        metrics: [{ id: 'metric-1', metric_name: 'error_rate' }],
        sessions: [],
        patterns: [],
        eventDeltas: [],
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockClickStackService.getCorrelatedData.mockResolvedValue(mockCorrelatedData);

      const response = await request(app)
        .get('/clickstack/correlations/corr-1')
        .query({ dataTypes: 'logs,traces,metrics' })
        .expect(200);

      expect(response.body).toEqual(mockCorrelatedData);
      expect(mockClickStackService.getCorrelatedData).toHaveBeenCalledWith(
        'test-team-id',
        'corr-1',
        ['logs', 'traces', 'metrics']
      );
    });
  });

  describe('GET /clickstack/metadata', () => {
    it('should return metadata for specific key', async () => {
      const mockMetadata = {
        key: 'version',
        value: '1.0',
        teamId: 'test-team-id',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockClickStackService.getMetadata.mockResolvedValue(mockMetadata);

      const response = await request(app)
        .get('/clickstack/metadata')
        .query({ key: 'version' })
        .expect(200);

      expect(response.body).toEqual(mockMetadata);
      expect(mockClickStackService.getMetadata).toHaveBeenCalledWith('test-team-id', 'version');
    });

    it('should return all metadata when no key specified', async () => {
      const mockMetadata = [
        {
          key: 'version',
          value: '1.0',
          teamId: 'test-team-id',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          key: 'environment',
          value: 'production',
          teamId: 'test-team-id',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockClickStackService.getMetadata.mockResolvedValue(mockMetadata);

      const response = await request(app)
        .get('/clickstack/metadata')
        .expect(200);

      expect(response.body).toEqual(mockMetadata);
      expect(mockClickStackService.getMetadata).toHaveBeenCalledWith('test-team-id', undefined);
    });
  });

  describe('PUT /clickstack/metadata', () => {
    it('should update metadata', async () => {
      const updateRequest = {
        key: 'version',
        value: '2.0',
      };

      const mockUpdatedMetadata = {
        key: 'version',
        value: '2.0',
        teamId: 'test-team-id',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockClickStackService.updateMetadata.mockResolvedValue(mockUpdatedMetadata);

      const response = await request(app)
        .put('/clickstack/metadata')
        .send(updateRequest)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedMetadata);
      expect(mockClickStackService.updateMetadata).toHaveBeenCalledWith(
        'test-team-id',
        'version',
        '2.0'
      );
    });

    it('should validate update request body', async () => {
      const invalidRequest = {
        // Missing required fields
        value: '2.0',
      };

      await request(app)
        .put('/clickstack/metadata')
        .send(invalidRequest)
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockClickStackService.getHealth.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/clickstack/health')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Database connection failed');
    });

    it('should handle validation errors', async () => {
      await request(app)
        .post('/clickstack/search')
        .send({}) // Missing required query field
        .expect(400);
    });
  });
});
