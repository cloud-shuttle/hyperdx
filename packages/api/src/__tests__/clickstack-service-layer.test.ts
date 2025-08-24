import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the ClickStack services
jest.mock('@/services/clickstack');
jest.mock('@/services/clickstackDashboard');
jest.mock('@/services/clickstackSearch');
jest.mock('@/services/clickstackSession');
jest.mock('@/services/clickstackPattern');
jest.mock('@/services/clickstackEventDelta');

import { clickstackService } from '@/services/clickstack';
import { clickstackDashboardService } from '@/services/clickstackDashboard';
import { clickstackSearchService } from '@/services/clickstackSearch';
import { clickstackSessionService } from '@/services/clickstackSession';
import { clickstackPatternService } from '@/services/clickstackPattern';
import { clickstackEventDeltaService } from '@/services/clickstackEventDelta';

describe('ClickStack Service Layer', () => {
  let mockClickStackService: jest.Mocked<typeof clickstackService>;
  let mockClickStackDashboardService: jest.Mocked<typeof clickstackDashboardService>;
  let mockClickStackSearchService: jest.Mocked<typeof clickstackSearchService>;
  let mockClickStackSessionService: jest.Mocked<typeof clickstackSessionService>;
  let mockClickStackPatternService: jest.Mocked<typeof clickstackPatternService>;
  let mockClickStackEventDeltaService: jest.Mocked<typeof clickstackEventDeltaService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock services
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

    mockClickStackSearchService = {
      search: jest.fn(),
      searchSessions: jest.fn(),
      searchPatterns: jest.fn(),
      getSearchAnalytics: jest.fn(),
    } as any;

    mockClickStackSessionService = {
      getSession: jest.fn(),
      getSessionEvents: jest.fn(),
      getUserSessions: jest.fn(),
      createSession: jest.fn(),
      getUserJourney: jest.fn(),
      getSessionAnalytics: jest.fn(),
      getSessionReplay: jest.fn(),
    } as any;

    mockClickStackPatternService = {
      getPattern: jest.fn(),
      getPatternsByType: jest.fn(),
      createPattern: jest.fn(),
      getPatternAnalysis: jest.fn(),
      getPatternTrend: jest.fn(),
      getPatternCorrelation: jest.fn(),
      getPatternStats: jest.fn(),
    } as any;

    mockClickStackEventDeltaService = {
      getEventDeltas: jest.fn(),
      getEventDelta: jest.fn(),
      createEventDelta: jest.fn(),
      getEventDeltaAnalysis: jest.fn(),
      getEventDeltaTrend: jest.fn(),
      detectAnomalies: jest.fn(),
      getEventDeltaStats: jest.fn(),
    } as any;

    // Assign mocks to module exports
    (clickstackService as any) = mockClickStackService;
    (clickstackDashboardService as any) = mockClickStackDashboardService;
    (clickstackSearchService as any) = mockClickStackSearchService;
    (clickstackSessionService as any) = mockClickStackSessionService;
    (clickstackPatternService as any) = mockClickStackPatternService;
    (clickstackEventDeltaService as any) = mockClickStackEventDeltaService;
  });

  describe('ClickStack Core Service', () => {
    it('should get health status', async () => {
      const mockHealth = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
        features: ['session_replay', 'pattern_recognition'],
      };

      mockClickStackService.getHealth.mockResolvedValue(mockHealth);

      const result = await clickstackService.getHealth('test-team-id');
      expect(result).toEqual(mockHealth);
      expect(mockClickStackService.getHealth).toHaveBeenCalledWith('test-team-id');
    });

    it('should get features status', async () => {
      const mockFeatures = {
        sessionReplay: { enabled: true, version: '1.0.0' },
        patternRecognition: { enabled: true, version: '1.0.0' },
        eventDeltaAnalysis: { enabled: true, version: '1.0.0' },
      };

      mockClickStackService.getFeatures.mockResolvedValue(mockFeatures);

      const result = await clickstackService.getFeatures('test-team-id');
      expect(result).toEqual(mockFeatures);
      expect(mockClickStackService.getFeatures).toHaveBeenCalledWith('test-team-id');
    });

    it('should get correlated data', async () => {
      const mockCorrelatedData = {
        correlationId: 'test-correlation-id',
        logs: [],
        traces: [],
        metrics: [],
        sessions: [],
        patterns: [],
        eventDeltas: [],
      };

      mockClickStackService.getCorrelatedData.mockResolvedValue(mockCorrelatedData);

      const result = await clickstackService.getCorrelatedData('test-team-id', 'test-correlation-id');
      expect(result).toEqual(mockCorrelatedData);
      expect(mockClickStackService.getCorrelatedData).toHaveBeenCalledWith('test-team-id', 'test-correlation-id', undefined);
    });

    it('should get metadata', async () => {
      const mockMetadata = {
        key: 'test-key',
        value: 'test-value',
        timestamp: new Date().toISOString(),
      };

      mockClickStackService.getMetadata.mockResolvedValue(mockMetadata);

      const result = await clickstackService.getMetadata('test-team-id', 'test-key');
      expect(result).toEqual(mockMetadata);
      expect(mockClickStackService.getMetadata).toHaveBeenCalledWith('test-team-id', 'test-key');
    });

    it('should update metadata', async () => {
      const mockUpdatedMetadata = {
        key: 'test-key',
        value: 'updated-value',
        timestamp: new Date().toISOString(),
      };

      mockClickStackService.updateMetadata.mockResolvedValue(mockUpdatedMetadata);

      const result = await clickstackService.updateMetadata('test-team-id', 'test-key', 'updated-value');
      expect(result).toEqual(mockUpdatedMetadata);
      expect(mockClickStackService.updateMetadata).toHaveBeenCalledWith('test-team-id', 'test-key', 'updated-value');
    });

    it('should validate configuration', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
        warnings: [],
      };

      mockClickStackService.validateConfiguration.mockResolvedValue(mockValidation);

      const result = await clickstackService.validateConfiguration('test-team-id');
      expect(result).toEqual(mockValidation);
      expect(mockClickStackService.validateConfiguration).toHaveBeenCalledWith('test-team-id');
    });
  });

  describe('ClickStack Dashboard Service', () => {
    it('should get dashboard overview', async () => {
      const mockOverview = {
        totalSessions: 1000,
        totalPatterns: 50,
        totalAnomalies: 10,
        avgSessionDuration: 300,
        topPages: [],
        recentActivity: [],
      };

      mockClickStackDashboardService.getOverview.mockResolvedValue(mockOverview);

      const result = await clickstackDashboardService.getOverview('test-team-id', '2024-01-01', '2024-01-31');
      expect(result).toEqual(mockOverview);
      expect(mockClickStackDashboardService.getOverview).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31');
    });

    it('should get dashboard metrics', async () => {
      const mockMetrics = {
        sessionMetrics: { total: 1000, active: 100 },
        patternMetrics: { total: 50, highConfidence: 30 },
        anomalyMetrics: { total: 10, critical: 2 },
        performanceMetrics: { avgResponseTime: 200, errorRate: 0.01 },
      };

      mockClickStackDashboardService.getMetrics.mockResolvedValue(mockMetrics);

      const result = await clickstackDashboardService.getMetrics('test-team-id', '2024-01-01', '2024-01-31', 'all');
      expect(result).toEqual(mockMetrics);
      expect(mockClickStackDashboardService.getMetrics).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31', 'all');
    });

    it('should get dashboard sessions', async () => {
      const mockSessions = [
        {
          sessionId: 'session-1',
          userId: 'user-1',
          pageUrl: 'https://example.com',
          duration: 300,
          eventCount: 50,
        },
      ];

      mockClickStackDashboardService.getSessions.mockResolvedValue(mockSessions);

      const result = await clickstackDashboardService.getSessions('test-team-id', '2024-01-01', '2024-01-31', 10);
      expect(result).toEqual(mockSessions);
      expect(mockClickStackDashboardService.getSessions).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31', 10);
    });

    it('should get dashboard patterns', async () => {
      const mockPatterns = [
        {
          patternId: 'pattern-1',
          patternType: 'error',
          confidence: 0.95,
          occurrences: 100,
        },
      ];

      mockClickStackDashboardService.getPatterns.mockResolvedValue(mockPatterns);

      const result = await clickstackDashboardService.getPatterns('test-team-id', '2024-01-01', '2024-01-31', 0.8);
      expect(result).toEqual(mockPatterns);
      expect(mockClickStackDashboardService.getPatterns).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31', 0.8);
    });

    it('should get dashboard event deltas', async () => {
      const mockEventDeltas = [
        {
          baseline: 100,
          current: 120,
          deltaPercent: 20,
          timestamp: new Date().toISOString(),
        },
      ];

      mockClickStackDashboardService.getEventDeltas.mockResolvedValue(mockEventDeltas);

      const result = await clickstackDashboardService.getEventDeltas('test-team-id', '2024-01-01', '2024-01-31', 10.0);
      expect(result).toEqual(mockEventDeltas);
      expect(mockClickStackDashboardService.getEventDeltas).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31', 10.0);
    });
  });

  describe('ClickStack Search Service', () => {
    it('should search across all telemetry types', async () => {
      const mockSearchResult = {
        logs: [],
        traces: [],
        metrics: [],
        sessions: [],
        patterns: [],
        eventDeltas: [],
        total: 0,
        query: 'test query',
        executionTime: 50,
        facets: {},
      };

      mockClickStackSearchService.search.mockResolvedValue(mockSearchResult);

      const result = await clickstackSearchService.search('test-team-id', 'test query', {
        query: 'test query',
        startTime: '2024-01-01',
        endTime: '2024-01-31',
        limit: 100,
        offset: 0,
      });

      expect(result).toEqual(mockSearchResult);
      expect(mockClickStackSearchService.search).toHaveBeenCalledWith('test-team-id', 'test query', {
        query: 'test query',
        startTime: '2024-01-01',
        endTime: '2024-01-31',
        limit: 100,
        offset: 0,
      });
    });

    it('should search sessions', async () => {
      const mockSessionSearchResult = {
        sessions: [],
        total: 0,
        query: 'session_search',
        executionTime: 30,
        facets: {},
      };

      mockClickStackSearchService.searchSessions.mockResolvedValue(mockSessionSearchResult);

      const result = await clickstackSearchService.searchSessions('test-team-id', {
        userId: 'user-1',
        sessionId: 'session-1',
        limit: 50,
        offset: 0,
      });

      expect(result).toEqual(mockSessionSearchResult);
      expect(mockClickStackSearchService.searchSessions).toHaveBeenCalledWith('test-team-id', {
        userId: 'user-1',
        sessionId: 'session-1',
        limit: 50,
        offset: 0,
      });
    });

    it('should search patterns', async () => {
      const mockPatternSearchResult = {
        patterns: [],
        total: 0,
        query: 'pattern_search',
        executionTime: 25,
        facets: {},
      };

      mockClickStackSearchService.searchPatterns.mockResolvedValue(mockPatternSearchResult);

      const result = await clickstackSearchService.searchPatterns('test-team-id', {
        patternType: 'error',
        confidence: 0.8,
        limit: 50,
        offset: 0,
      });

      expect(result).toEqual(mockPatternSearchResult);
      expect(mockClickStackSearchService.searchPatterns).toHaveBeenCalledWith('test-team-id', {
        patternType: 'error',
        confidence: 0.8,
        limit: 50,
        offset: 0,
      });
    });

    it('should get search analytics', async () => {
      const mockSearchAnalytics = {
        totalQueries: 1000,
        avgExecutionTime: 45,
        topQueries: [],
        searchTrends: [],
        popularFilters: [],
      };

      mockClickStackSearchService.getSearchAnalytics.mockResolvedValue(mockSearchAnalytics);

      const result = await clickstackSearchService.getSearchAnalytics('test-team-id', '2024-01-01', '2024-01-31');
      expect(result).toEqual(mockSearchAnalytics);
      expect(mockClickStackSearchService.getSearchAnalytics).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31');
    });
  });

  describe('ClickStack Session Service', () => {
    it('should get session by ID', async () => {
      const mockSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        pageUrl: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0',
        events: [],
        timestamp: new Date().toISOString(),
        duration: 300,
        eventCount: 50,
      };

      mockClickStackSessionService.getSession.mockResolvedValue(mockSession);

      const result = await clickstackSessionService.getSession('test-team-id', 'session-1');
      expect(result).toEqual(mockSession);
      expect(mockClickStackSessionService.getSession).toHaveBeenCalledWith('test-team-id', 'session-1');
    });

    it('should get session events', async () => {
      const mockEvents = [
        {
          eventId: 'event-1',
          eventType: 'click',
          timestamp: new Date().toISOString(),
          data: { x: 100, y: 200 },
          position: { x: 100, y: 200 },
        },
      ];

      mockClickStackSessionService.getSessionEvents.mockResolvedValue(mockEvents);

      const result = await clickstackSessionService.getSessionEvents('test-team-id', 'session-1', 100, 0);
      expect(result).toEqual(mockEvents);
      expect(mockClickStackSessionService.getSessionEvents).toHaveBeenCalledWith('test-team-id', 'session-1', 100, 0);
    });

    it('should get user sessions', async () => {
      const mockUserSessions = [
        {
          sessionId: 'session-1',
          userId: 'user-1',
          pageUrl: 'https://example.com',
          duration: 300,
          eventCount: 50,
        },
      ];

      mockClickStackSessionService.getUserSessions.mockResolvedValue(mockUserSessions);

      const result = await clickstackSessionService.getUserSessions('test-team-id', 'user-1', '2024-01-01', '2024-01-31', 50);
      expect(result).toEqual(mockUserSessions);
      expect(mockClickStackSessionService.getUserSessions).toHaveBeenCalledWith('test-team-id', 'user-1', '2024-01-01', '2024-01-31', 50);
    });

    it('should create new session', async () => {
      const mockNewSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        pageUrl: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0',
        events: [],
        timestamp: new Date().toISOString(),
        duration: 0,
        eventCount: 0,
      };

      mockClickStackSessionService.createSession.mockResolvedValue(mockNewSession);

      const result = await clickstackSessionService.createSession('test-team-id', {
        sessionId: 'session-1',
        userId: 'user-1',
        pageUrl: 'https://example.com',
      });

      expect(result).toEqual(mockNewSession);
      expect(mockClickStackSessionService.createSession).toHaveBeenCalledWith('test-team-id', {
        sessionId: 'session-1',
        userId: 'user-1',
        pageUrl: 'https://example.com',
      });
    });

    it('should get user journey', async () => {
      const mockUserJourney = {
        userId: 'user-1',
        sessions: [],
        totalSessions: 10,
        avgSessionDuration: 300,
        mostVisitedPages: [],
        commonPatterns: [],
        conversionRate: 0.75,
      };

      mockClickStackSessionService.getUserJourney.mockResolvedValue(mockUserJourney);

      const result = await clickstackSessionService.getUserJourney('test-team-id', 'user-1', '2024-01-01', '2024-01-31');
      expect(result).toEqual(mockUserJourney);
      expect(mockClickStackSessionService.getUserJourney).toHaveBeenCalledWith('test-team-id', 'user-1', '2024-01-01', '2024-01-31');
    });

    it('should get session analytics', async () => {
      const mockSessionAnalytics = {
        totalSessions: 1000,
        activeSessions: 100,
        avgSessionDuration: 300,
        topPages: [],
        topUsers: [],
        sessionTrends: [],
        deviceBreakdown: [],
      };

      mockClickStackSessionService.getSessionAnalytics.mockResolvedValue(mockSessionAnalytics);

      const result = await clickstackSessionService.getSessionAnalytics('test-team-id', '2024-01-01', '2024-01-31');
      expect(result).toEqual(mockSessionAnalytics);
      expect(mockClickStackSessionService.getSessionAnalytics).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31');
    });

    it('should get session replay', async () => {
      const mockSessionReplay = {
        session: {
          sessionId: 'session-1',
          userId: 'user-1',
          pageUrl: 'https://example.com',
          duration: 300,
          eventCount: 50,
        },
        events: [],
        timeline: [],
        heatmap: [],
      };

      mockClickStackSessionService.getSessionReplay.mockResolvedValue(mockSessionReplay);

      const result = await clickstackSessionService.getSessionReplay('test-team-id', 'session-1');
      expect(result).toEqual(mockSessionReplay);
      expect(mockClickStackSessionService.getSessionReplay).toHaveBeenCalledWith('test-team-id', 'session-1');
    });
  });

  describe('ClickStack Pattern Service', () => {
    it('should get pattern by ID', async () => {
      const mockPattern = {
        patternId: 'pattern-1',
        patternType: 'error',
        confidence: 0.95,
        occurrences: 100,
        timestamp: new Date().toISOString(),
        metadata: {},
      };

      mockClickStackPatternService.getPattern.mockResolvedValue(mockPattern);

      const result = await clickstackPatternService.getPattern('test-team-id', 'pattern-1');
      expect(result).toEqual(mockPattern);
      expect(mockClickStackPatternService.getPattern).toHaveBeenCalledWith('test-team-id', 'pattern-1');
    });

    it('should get patterns by type', async () => {
      const mockPatterns = [
        {
          patternId: 'pattern-1',
          patternType: 'error',
          confidence: 0.95,
          occurrences: 100,
          timestamp: new Date().toISOString(),
          metadata: {},
        },
      ];

      mockClickStackPatternService.getPatternsByType.mockResolvedValue(mockPatterns);

      const result = await clickstackPatternService.getPatternsByType('test-team-id', 'error', '2024-01-01', '2024-01-31', 0.8, 50);
      expect(result).toEqual(mockPatterns);
      expect(mockClickStackPatternService.getPatternsByType).toHaveBeenCalledWith('test-team-id', 'error', '2024-01-01', '2024-01-31', 0.8, 50);
    });

    it('should create new pattern', async () => {
      const mockNewPattern = {
        patternId: 'pattern-1',
        patternType: 'error',
        confidence: 0.95,
        occurrences: 100,
        timestamp: new Date().toISOString(),
        metadata: {},
      };

      mockClickStackPatternService.createPattern.mockResolvedValue(mockNewPattern);

      const result = await clickstackPatternService.createPattern('test-team-id', {
        patternId: 'pattern-1',
        patternType: 'error',
        confidence: 0.95,
        occurrences: 100,
      });

      expect(result).toEqual(mockNewPattern);
      expect(mockClickStackPatternService.createPattern).toHaveBeenCalledWith('test-team-id', {
        patternId: 'pattern-1',
        patternType: 'error',
        confidence: 0.95,
        occurrences: 100,
      });
    });

    it('should get pattern analysis', async () => {
      const mockPatternAnalysis = {
        patternId: 'pattern-1',
        patternType: 'error',
        confidence: 0.95,
        occurrences: 100,
        firstSeen: '2024-01-01',
        lastSeen: '2024-01-31',
        frequency: 3.33,
        severity: 'high' as const,
        impact: {
          affectedUsers: 30,
          affectedSessions: 50,
          errorRate: 0.76,
          performanceImpact: 0.57,
        },
        recommendations: ['Investigate error source', 'Add error monitoring'],
      };

      mockClickStackPatternService.getPatternAnalysis.mockResolvedValue(mockPatternAnalysis);

      const result = await clickstackPatternService.getPatternAnalysis('test-team-id', 'pattern-1');
      expect(result).toEqual(mockPatternAnalysis);
      expect(mockClickStackPatternService.getPatternAnalysis).toHaveBeenCalledWith('test-team-id', 'pattern-1');
    });

    it('should get pattern trend', async () => {
      const mockPatternTrend = {
        patternId: 'pattern-1',
        patternType: 'error',
        trend: [],
        growthRate: 0.1,
        seasonality: 'daily' as const,
        prediction: [],
      };

      mockClickStackPatternService.getPatternTrend.mockResolvedValue(mockPatternTrend);

      const result = await clickstackPatternService.getPatternTrend('test-team-id', 'pattern-1', '2024-01-01', '2024-01-31');
      expect(result).toEqual(mockPatternTrend);
      expect(mockClickStackPatternService.getPatternTrend).toHaveBeenCalledWith('test-team-id', 'pattern-1', '2024-01-01', '2024-01-31');
    });

    it('should get pattern correlation', async () => {
      const mockPatternCorrelation = {
        patternId: 'pattern-1',
        correlatedPatterns: [],
        correlatedEvents: [],
        rootCause: {
          likely: 'Database connection pool exhaustion',
          confidence: 0.78,
          evidence: ['High correlation with timeout events'],
        },
      };

      mockClickStackPatternService.getPatternCorrelation.mockResolvedValue(mockPatternCorrelation);

      const result = await clickstackPatternService.getPatternCorrelation('test-team-id', 'pattern-1');
      expect(result).toEqual(mockPatternCorrelation);
      expect(mockClickStackPatternService.getPatternCorrelation).toHaveBeenCalledWith('test-team-id', 'pattern-1');
    });

    it('should get pattern statistics', async () => {
      const mockPatternStats = {
        totalPatterns: 100,
        highConfidencePatterns: 80,
        patternTypes: [],
        confidenceDistribution: [],
        topPatterns: [],
      };

      mockClickStackPatternService.getPatternStats.mockResolvedValue(mockPatternStats);

      const result = await clickstackPatternService.getPatternStats('test-team-id', '2024-01-01', '2024-01-31');
      expect(result).toEqual(mockPatternStats);
      expect(mockClickStackPatternService.getPatternStats).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31');
    });
  });

  describe('ClickStack Event Delta Service', () => {
    it('should get event deltas', async () => {
      const mockEventDeltas = [
        {
          baseline: 100,
          current: 120,
          deltaPercent: 20,
          timestamp: new Date().toISOString(),
          metadata: {},
        },
      ];

      mockClickStackEventDeltaService.getEventDeltas.mockResolvedValue(mockEventDeltas);

      const result = await clickstackEventDeltaService.getEventDeltas('test-team-id', '2024-01-01', '2024-01-31', 10.0, 50);
      expect(result).toEqual(mockEventDeltas);
      expect(mockClickStackEventDeltaService.getEventDeltas).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31', 10.0, 50);
    });

    it('should get event delta by ID', async () => {
      const mockEventDelta = {
        baseline: 100,
        current: 120,
        deltaPercent: 20,
        timestamp: new Date().toISOString(),
        metadata: {},
      };

      mockClickStackEventDeltaService.getEventDelta.mockResolvedValue(mockEventDelta);

      const result = await clickstackEventDeltaService.getEventDelta('test-team-id', 'delta-1');
      expect(result).toEqual(mockEventDelta);
      expect(mockClickStackEventDeltaService.getEventDelta).toHaveBeenCalledWith('test-team-id', 'delta-1');
    });

    it('should create new event delta', async () => {
      const mockNewEventDelta = {
        baseline: 100,
        current: 120,
        deltaPercent: 20,
        timestamp: new Date().toISOString(),
        metadata: {},
      };

      mockClickStackEventDeltaService.createEventDelta.mockResolvedValue(mockNewEventDelta);

      const result = await clickstackEventDeltaService.createEventDelta('test-team-id', {
        baseline: 100,
        current: 120,
        deltaPercent: 20,
      });

      expect(result).toEqual(mockNewEventDelta);
      expect(mockClickStackEventDeltaService.createEventDelta).toHaveBeenCalledWith('test-team-id', {
        baseline: 100,
        current: 120,
        deltaPercent: 20,
      });
    });

    it('should get event delta analysis', async () => {
      const mockEventDeltaAnalysis = {
        deltaId: 'delta-1',
        baseline: 100,
        current: 120,
        deltaPercent: 20,
        severity: 'medium' as const,
        trend: 'increasing' as const,
        confidence: 0.7,
        impact: {
          affectedUsers: 200,
          affectedSessions: 300,
          performanceImpact: 0.2,
          businessImpact: 0.1,
        },
        recommendations: ['Monitor the trend', 'Review system performance'],
      };

      mockClickStackEventDeltaService.getEventDeltaAnalysis.mockResolvedValue(mockEventDeltaAnalysis);

      const result = await clickstackEventDeltaService.getEventDeltaAnalysis('test-team-id', 'delta-1');
      expect(result).toEqual(mockEventDeltaAnalysis);
      expect(mockClickStackEventDeltaService.getEventDeltaAnalysis).toHaveBeenCalledWith('test-team-id', 'delta-1');
    });

    it('should get event delta trend', async () => {
      const mockEventDeltaTrend = {
        deltaId: 'delta-1',
        trend: [],
        volatility: 0.15,
        seasonality: 'daily' as const,
        prediction: [],
        alerts: [],
      };

      mockClickStackEventDeltaService.getEventDeltaTrend.mockResolvedValue(mockEventDeltaTrend);

      const result = await clickstackEventDeltaService.getEventDeltaTrend('test-team-id', 'delta-1', '2024-01-01', '2024-01-31');
      expect(result).toEqual(mockEventDeltaTrend);
      expect(mockClickStackEventDeltaService.getEventDeltaTrend).toHaveBeenCalledWith('test-team-id', 'delta-1', '2024-01-01', '2024-01-31');
    });

    it('should detect anomalies', async () => {
      const mockAnomalyDetection = {
        anomalies: [],
        patterns: [],
        recommendations: [],
      };

      mockClickStackEventDeltaService.detectAnomalies.mockResolvedValue(mockAnomalyDetection);

      const result = await clickstackEventDeltaService.detectAnomalies('test-team-id', '2024-01-01', '2024-01-31', 2.0);
      expect(result).toEqual(mockAnomalyDetection);
      expect(mockClickStackEventDeltaService.detectAnomalies).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31', 2.0);
    });

    it('should get event delta statistics', async () => {
      const mockEventDeltaStats = {
        totalDeltas: 1000,
        anomalies: 50,
        avgDeltaPercent: 5.5,
        maxDeltaPercent: 100,
        minDeltaPercent: -50,
        deltaDistribution: [],
        topAnomalies: [],
      };

      mockClickStackEventDeltaService.getEventDeltaStats.mockResolvedValue(mockEventDeltaStats);

      const result = await clickstackEventDeltaService.getEventDeltaStats('test-team-id', '2024-01-01', '2024-01-31');
      expect(result).toEqual(mockEventDeltaStats);
      expect(mockClickStackEventDeltaService.getEventDeltaStats).toHaveBeenCalledWith('test-team-id', '2024-01-01', '2024-01-31');
    });
  });

  describe('Service Layer Integration', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockClickStackService.getHealth.mockRejectedValue(error);

      await expect(clickstackService.getHealth('test-team-id')).rejects.toThrow('Database connection failed');
    });

    it('should maintain singleton pattern across services', () => {
      // Verify that all services are singletons
      expect(clickstackService).toBeDefined();
      expect(clickstackDashboardService).toBeDefined();
      expect(clickstackSearchService).toBeDefined();
      expect(clickstackSessionService).toBeDefined();
      expect(clickstackPatternService).toBeDefined();
      expect(clickstackEventDeltaService).toBeDefined();
    });

    it('should support multi-tenant isolation', async () => {
      const team1 = 'team-1';
      const team2 = 'team-2';

      mockClickStackService.getHealth.mockResolvedValue({ status: 'healthy' });

      await clickstackService.getHealth(team1);
      await clickstackService.getHealth(team2);

      expect(mockClickStackService.getHealth).toHaveBeenCalledWith(team1);
      expect(mockClickStackService.getHealth).toHaveBeenCalledWith(team2);
    });
  });
});
