import express from 'express';
import { z } from 'zod';

import { getNonNullUserWithTeam } from '@/middleware/auth';
import { objectIdSchema } from '@/utils/zod';
import { clickstackService } from '@/services/clickstack';
import { clickstackDashboardService } from '@/services/clickstackDashboard';
import { clickstackSearchService } from '@/services/clickstackSearch';
import { clickstackSessionService } from '@/services/clickstackSession';
import { clickstackPatternService } from '@/services/clickstackPattern';
import { clickstackEventDeltaService } from '@/services/clickstackEventDelta';

const router = express.Router();

// ============================================================================
// CLICKSTACK DASHBOARD ENDPOINTS
// ============================================================================

// Get ClickStack dashboard overview
router.get('/dashboard/overview', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime } = req.query;

    const overview = await clickstackDashboardService.getOverview(
      teamIdStr,
      startTime as string,
      endTime as string
    );

    return res.json(overview);
  } catch (e) {
    next(e);
  }
});

// Get ClickStack dashboard metrics
router.get('/dashboard/metrics', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime, metricType } = req.query;

    const metrics = await clickstackDashboardService.getMetrics(
      teamIdStr,
      startTime as string,
      endTime as string,
      metricType as string
    );

    return res.json(metrics);
  } catch (e) {
    next(e);
  }
});

// Get ClickStack sessions for dashboard
router.get('/dashboard/sessions', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime, limit } = req.query;

    const sessions = await clickstackDashboardService.getSessions(
      teamIdStr,
      startTime as string,
      endTime as string,
      limit ? parseInt(limit as string) : 50
    );

    return res.json(sessions);
  } catch (e) {
    next(e);
  }
});

// Get ClickStack patterns for dashboard
router.get('/dashboard/patterns', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime, confidence } = req.query;

    const patterns = await clickstackDashboardService.getPatterns(
      teamIdStr,
      startTime as string,
      endTime as string,
      confidence ? parseFloat(confidence as string) : 0.8
    );

    return res.json(patterns);
  } catch (e) {
    next(e);
  }
});

// Get ClickStack event deltas for dashboard
router.get('/dashboard/event-deltas', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime, threshold } = req.query;

    const eventDeltas = await clickstackDashboardService.getEventDeltas(
      teamIdStr,
      startTime as string,
      endTime as string,
      threshold ? parseFloat(threshold as string) : 10.0
    );

    return res.json(eventDeltas);
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// CLICKSTACK SEARCH ENDPOINTS
// ============================================================================

// Search ClickStack data
router.post('/search', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { query, startTime, endTime, filters, limit, offset } = req.body;

    // Validate required fields
    if (!query || typeof query !== 'string' || query.length === 0) {
      return res.status(400).json({ error: 'Query is required and must be a non-empty string' });
    }

    const results = await clickstackSearchService.search(teamIdStr, query, {
      query,
      startTime,
      endTime,
      filters,
      limit,
      offset,
    });

    return res.json(results);
  } catch (e) {
    next(e);
  }
});

// Search ClickStack sessions
router.get('/search/sessions', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { userId, sessionId, pageUrl, startTime, endTime, limit, offset } = req.query;

    const results = await clickstackSearchService.searchSessions(teamIdStr, {
      userId: userId as string,
      sessionId: sessionId as string,
      pageUrl: pageUrl as string,
      startTime: startTime as string,
      endTime: endTime as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    return res.json(results);
  } catch (e) {
    next(e);
  }
});

// Search ClickStack patterns
router.get('/search/patterns', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { patternType, confidence, startTime, endTime, limit, offset } = req.query;

    const results = await clickstackSearchService.searchPatterns(teamIdStr, {
      patternType: patternType as string,
      confidence: confidence ? parseFloat(confidence as string) : 0.8,
      startTime: startTime as string,
      endTime: endTime as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    return res.json(results);
  } catch (e) {
    next(e);
  }
});

// Get search analytics
router.get('/search/analytics', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime } = req.query;

    const analytics = await clickstackSearchService.getSearchAnalytics(
      teamIdStr,
      startTime as string,
      endTime as string
    );

    return res.json(analytics);
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// CLICKSTACK SESSION REPLAY ENDPOINTS
// ============================================================================

// Get session by ID
router.get('/sessions/:sessionId', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { sessionId } = req.params;

    const session = await clickstackSessionService.getSession(teamIdStr, sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json(session);
  } catch (e) {
    next(e);
  }
});

// Get session events
router.get('/sessions/:sessionId/events', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { sessionId } = req.params;
    const { limit, offset } = req.query;

    const events = await clickstackSessionService.getSessionEvents(
      teamIdStr,
      sessionId,
      limit ? parseInt(limit as string) : 100,
      offset ? parseInt(offset as string) : 0
    );

    return res.json(events);
  } catch (e) {
    next(e);
  }
});

// Get user sessions
router.get('/sessions/user/:userId', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { userId } = req.params;
    const { startTime, endTime, limit } = req.query;

    const sessions = await clickstackSessionService.getUserSessions(
      teamIdStr,
      userId,
      startTime as string,
      endTime as string,
      limit ? parseInt(limit as string) : 50
    );

    return res.json(sessions);
  } catch (e) {
    next(e);
  }
});

// Create new session
router.post('/sessions', async (req, res, next) => {
    try {
      const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
      const sessionData = req.body;

      const session = await clickstackSessionService.createSession(teamIdStr, sessionData);
      return res.status(201).json(session);
    } catch (e) {
      next(e);
    }
  }
);

// Get user journey analysis
router.get('/sessions/user/:userId/journey', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { userId } = req.params;
    const { startTime, endTime } = req.query;

    const journey = await clickstackSessionService.getUserJourney(
      teamIdStr,
      userId,
      startTime as string,
      endTime as string
    );

    return res.json(journey);
  } catch (e) {
    next(e);
  }
});

// Get session analytics
router.get('/sessions/analytics', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime } = req.query;

    const analytics = await clickstackSessionService.getSessionAnalytics(
      teamIdStr,
      startTime as string,
      endTime as string
    );

    return res.json(analytics);
  } catch (e) {
    next(e);
  }
});

// Get session replay data
router.get('/sessions/:sessionId/replay', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { sessionId } = req.params;

    const replay = await clickstackSessionService.getSessionReplay(teamIdStr, sessionId);
    return res.json(replay);
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// CLICKSTACK PATTERN RECOGNITION ENDPOINTS
// ============================================================================

// Get pattern by ID
router.get('/patterns/:patternId', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { patternId } = req.params;

    const pattern = await clickstackPatternService.getPattern(teamIdStr, patternId);
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    return res.json(pattern);
  } catch (e) {
    next(e);
  }
});

// Get patterns by type
router.get('/patterns/type/:patternType', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { patternType } = req.params;
    const { startTime, endTime, confidence, limit } = req.query;

    const patterns = await clickstackPatternService.getPatternsByType(
      teamIdStr,
      patternType,
      startTime as string,
      endTime as string,
      confidence ? parseFloat(confidence as string) : 0.8,
      limit ? parseInt(limit as string) : 50
    );

    return res.json(patterns);
  } catch (e) {
    next(e);
  }
});

// Create new pattern
router.post('/patterns', async (req, res, next) => {
    try {
      const { teamId } = getNonNullUserWithTeam(req);
        const teamIdStr = teamId.toString();
      const patternData = req.body;

      const pattern = await clickstackPatternService.createPattern(teamIdStr, patternData);
      return res.status(201).json(pattern);
    } catch (e) {
      next(e);
    }
  }
);

// Get pattern analysis
router.get('/patterns/:patternId/analysis', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { patternId } = req.params;

    const analysis = await clickstackPatternService.getPatternAnalysis(teamIdStr, patternId);
    return res.json(analysis);
  } catch (e) {
    next(e);
  }
});

// Get pattern trend
router.get('/patterns/:patternId/trend', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { patternId } = req.params;
    const { startTime, endTime } = req.query;

    const trend = await clickstackPatternService.getPatternTrend(
      teamIdStr,
      patternId,
      startTime as string,
      endTime as string
    );

    return res.json(trend);
  } catch (e) {
    next(e);
  }
});

// Get pattern correlation
router.get('/patterns/:patternId/correlation', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { patternId } = req.params;

    const correlation = await clickstackPatternService.getPatternCorrelation(teamIdStr, patternId);
    return res.json(correlation);
  } catch (e) {
    next(e);
  }
});

// Get pattern statistics
router.get('/patterns/stats', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime } = req.query;

    const stats = await clickstackPatternService.getPatternStats(
      teamIdStr,
      startTime as string,
      endTime as string
    );

    return res.json(stats);
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// CLICKSTACK EVENT DELTA ENDPOINTS
// ============================================================================

// Get event deltas
router.get('/event-deltas', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime, threshold, limit } = req.query;

    const deltas = await clickstackEventDeltaService.getEventDeltas(
      teamIdStr,
      startTime as string,
      endTime as string,
      threshold ? parseFloat(threshold as string) : 10.0,
      limit ? parseInt(limit as string) : 50
    );

    return res.json(deltas);
  } catch (e) {
    next(e);
  }
});

// Get event delta by ID
router.get('/event-deltas/:deltaId', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { deltaId } = req.params;

    const delta = await clickstackEventDeltaService.getEventDelta(teamIdStr, deltaId);
    if (!delta) {
      return res.status(404).json({ error: 'Event delta not found' });
    }

    return res.json(delta);
  } catch (e) {
    next(e);
  }
});

// Create new event delta
router.post('/event-deltas', async (req, res, next) => {
    try {
      const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
      const deltaData = req.body;

      const delta = await clickstackEventDeltaService.createEventDelta(teamIdStr, deltaData);
      return res.status(201).json(delta);
    } catch (e) {
      next(e);
    }
  }
);

// Get event delta analysis
router.get('/event-deltas/:deltaId/analysis', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { deltaId } = req.params;

    const analysis = await clickstackEventDeltaService.getEventDeltaAnalysis(teamIdStr, deltaId);
    return res.json(analysis);
  } catch (e) {
    next(e);
  }
});

// Get event delta trend
router.get('/event-deltas/:deltaId/trend', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { deltaId } = req.params;
    const { startTime, endTime } = req.query;

    const trend = await clickstackEventDeltaService.getEventDeltaTrend(
      teamIdStr,
      deltaId,
      startTime as string,
      endTime as string
    );

    return res.json(trend);
  } catch (e) {
    next(e);
  }
});

// Detect anomalies
router.get('/event-deltas/anomalies', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime, threshold } = req.query;

    const anomalies = await clickstackEventDeltaService.detectAnomalies(
      teamIdStr,
      startTime as string,
      endTime as string,
      threshold ? parseFloat(threshold as string) : 2.0
    );

    return res.json(anomalies);
  } catch (e) {
    next(e);
  }
});

// Get event delta statistics
router.get('/event-deltas/stats', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { startTime, endTime } = req.query;

    const stats = await clickstackEventDeltaService.getEventDeltaStats(
      teamIdStr,
      startTime as string,
      endTime as string
    );

    return res.json(stats);
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// CLICKSTACK CORRELATION ENDPOINTS
// ============================================================================

// Get correlated data
router.get('/correlation/:correlationId', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { correlationId } = req.params;
    const { dataTypes } = req.query;

    const correlatedData = await clickstackService.getCorrelatedData(
      teamIdStr,
      correlationId,
      dataTypes ? (dataTypes as string).split(',') : undefined
    );

    return res.json(correlatedData);
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// CLICKSTACK HEALTH & METADATA ENDPOINTS
// ============================================================================

// Get ClickStack health
router.get('/health', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();

    const health = await clickstackService.getHealth(teamIdStr);
    return res.json(health);
  } catch (e) {
    next(e);
  }
});

// Get ClickStack features
router.get('/features', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();

    const features = await clickstackService.getFeatures(teamIdStr);
    return res.json(features);
  } catch (e) {
    next(e);
  }
});

// Get ClickStack metadata
router.get('/metadata', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
    const { key } = req.query;

    const metadata = await clickstackService.getMetadata(teamIdStr, key as string);
    return res.json(metadata);
  } catch (e) {
    next(e);
  }
});

// Update ClickStack metadata
router.put('/metadata/:key', async (req, res, next) => {
    try {
      const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();
      const { key } = req.params;
      const { value } = req.body;

      const metadata = await clickstackService.updateMetadata(teamIdStr, key, value);
      return res.json(metadata);
    } catch (e) {
      next(e);
    }
  }
);

// Validate ClickStack configuration
router.get('/config/validate', async (req, res, next) => {
  try {
    const { teamId } = getNonNullUserWithTeam(req);
      const teamIdStr = teamId.toString();

    const validation = await clickstackService.validateConfiguration(teamIdStr);
    return res.json(validation);
  } catch (e) {
    next(e);
  }
});

export default router;
