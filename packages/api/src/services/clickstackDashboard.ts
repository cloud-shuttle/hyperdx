import { client } from '@/clickhouse';

export interface ClickStackDashboardOverview {
  totalSessions: number;
  totalPatterns: number;
  totalEventDeltas: number;
  activeUsers: number;
  topPages: Array<{ pageUrl: string; count: number }>;
  topPatterns: Array<{ patternType: string; count: number }>;
  recentActivity: Array<{ timestamp: string; type: string; description: string }>;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ClickStackDashboardMetrics {
  sessions: {
    total: number;
    active: number;
    new: number;
    trend: Array<{ timestamp: string; count: number }>;
  };
  patterns: {
    total: number;
    highConfidence: number;
    new: number;
    trend: Array<{ timestamp: string; count: number }>;
  };
  eventDeltas: {
    total: number;
    anomalies: number;
    new: number;
    trend: Array<{ timestamp: string; count: number }>;
  };
  performance: {
    avgSessionDuration: number;
    avgPatternConfidence: number;
    avgDeltaPercent: number;
  };
}

export interface ClickStackSession {
  sessionId: string;
  userId: string;
  pageUrl: string;
  viewport: { width: number; height: number };
  userAgent: string;
  events: string[];
  timestamp: string;
  duration: number;
  eventCount: number;
}

export interface ClickStackPattern {
  patternId: string;
  patternType: string;
  confidence: number;
  occurrences: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface ClickStackEventDelta {
  baseline: number;
  current: number;
  deltaPercent: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export class ClickStackDashboardService {
  private static instance: ClickStackDashboardService;
  private clickhouse = client;

  private constructor() {
    // Use the singleton client instance
  }

  public static getInstance(): ClickStackDashboardService {
    if (!ClickStackDashboardService.instance) {
      ClickStackDashboardService.instance = new ClickStackDashboardService();
    }
    return ClickStackDashboardService.instance;
  }

  /**
   * Get ClickStack dashboard overview
   */
  async getOverview(
    teamId: string,
    startTime?: string,
    endTime?: string
  ): Promise<ClickStackDashboardOverview> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get total sessions
      const sessionsQuery = `
        SELECT count() as total_sessions
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const sessionsResult = await this.clickhouse.query({
          query: sessionsQuery,
          format: 'JSON'
        });
      const sessionsData = await sessionsResult.json() as any;
      const totalSessions = sessionsData.data[0]?.total_sessions || 0;

      // Get total patterns
      const patternsQuery = `
        SELECT count() as total_patterns
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const patternsResult = await this.clickhouse.query({
          query: patternsQuery,
          format: 'JSON'
        });
      const patternsData = await patternsResult.json() as any;
      const totalPatterns = patternsData.data[0]?.total_patterns || 0;

      // Get total event deltas
      const deltasQuery = `
        SELECT count() as total_deltas
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const deltasResult = await this.clickhouse.query({
          query: deltasQuery,
          format: 'JSON'
        });
      const deltasData = await deltasResult.json() as any;
      const totalEventDeltas = deltasData.data[0]?.total_deltas || 0;

      // Get active users
      const usersQuery = `
        SELECT uniq(clickstack_user_id) as active_users
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const usersResult = await this.clickhouse.query({
          query: usersQuery,
          format: 'JSON'
        });
      const usersData = await usersResult.json() as any;
      const activeUsers = usersData.data[0]?.active_users || 0;

      // Get top pages
      const pagesQuery = `
        SELECT 
          clickstack_page_url as pageUrl,
          count() as count
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY clickstack_page_url
        ORDER BY count DESC
        LIMIT 10
      `;

      const pagesResult = await this.clickhouse.query({
          query: pagesQuery,
          format: 'JSON'
        });
      const pagesData = await pagesResult.json() as any;
      const topPages = pagesData.data.map(row => ({
        pageUrl: row.pageUrl,
        count: row.count,
      }));

      // Get top patterns
      const topPatternsQuery = `
        SELECT 
          clickstack_pattern_type as patternType,
          count() as count
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY clickstack_pattern_type
        ORDER BY count DESC
        LIMIT 10
      `;

      const topPatternsResult = await this.clickhouse.query({
          query: topPatternsQuery,
          format: 'JSON'
        });
      const topPatternsData = await topPatternsResult.json() as any;
      const topPatterns = topPatternsData.data.map(row => ({
        patternType: row.patternType,
        count: row.count,
      }));

      // Get recent activity
      const activityQuery = `
        SELECT 
          timestamp,
          'session' as type,
          concat('New session on ', clickstack_page_url) as description
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        
        UNION ALL
        
        SELECT 
          timestamp,
          'pattern' as type,
          concat('Pattern detected: ', clickstack_pattern_type) as description
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        
        UNION ALL
        
        SELECT 
          timestamp,
          'delta' as type,
          concat('Event delta: ', toString(clickstack_delta_percent), '%') as description
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        
        ORDER BY timestamp DESC
        LIMIT 20
      `;

      const activityResult = await this.clickhouse.query({
          query: activityQuery,
          format: 'JSON'
        });
      const activityData = await activityResult.json() as any;
      const recentActivity = activityData.data.map(row => ({
        timestamp: row.timestamp,
        type: row.type,
        description: row.description,
      }));

      // Determine health status
      const healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 
        totalSessions > 0 && totalPatterns > 0 ? 'healthy' : 
        totalSessions > 0 || totalPatterns > 0 ? 'degraded' : 'unhealthy';

      return {
        totalSessions,
        totalPatterns,
        totalEventDeltas,
        activeUsers,
        topPages,
        topPatterns,
        recentActivity,
        healthStatus,
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard overview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ClickStack dashboard metrics
   */
  async getMetrics(
    teamId: string,
    startTime?: string,
    endTime?: string,
    metricType?: string
  ): Promise<ClickStackDashboardMetrics> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get session metrics
      const sessionMetricsQuery = `
        SELECT 
          count() as total,
          uniq(clickstack_session_id) as active,
          countIf(timestamp >= now() - INTERVAL 1 HOUR) as new,
          toStartOfHour(timestamp) as hour,
          count() as count
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      const sessionMetricsResult = await this.clickhouse.query({
          query: sessionMetricsQuery,
          format: 'JSON'
        });
      const sessionMetricsData = await sessionMetricsResult.json() as any;
      const sessionTrend = sessionMetricsData.data.map(row => ({
        timestamp: row.hour,
        count: row.count,
      }));

      // Get pattern metrics
      const patternMetricsQuery = `
        SELECT 
          count() as total,
          countIf(clickstack_pattern_confidence >= 0.8) as high_confidence,
          countIf(timestamp >= now() - INTERVAL 1 HOUR) as new,
          toStartOfHour(timestamp) as hour,
          count() as count
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      const patternMetricsResult = await this.clickhouse.query({
          query: patternMetricsQuery,
          format: 'JSON'
        });
      const patternMetricsData = await patternMetricsResult.json() as any;
      const patternTrend = patternMetricsData.data.map(row => ({
        timestamp: row.hour,
        count: row.count,
      }));

      // Get event delta metrics
      const deltaMetricsQuery = `
        SELECT 
          count() as total,
          countIf(abs(clickstack_delta_percent) > 10.0) as anomalies,
          countIf(timestamp >= now() - INTERVAL 1 HOUR) as new,
          toStartOfHour(timestamp) as hour,
          count() as count
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      const deltaMetricsResult = await this.clickhouse.query({
          query: deltaMetricsQuery,
          format: 'JSON'
        });
      const deltaMetricsData = await deltaMetricsResult.json() as any;
      const deltaTrend = deltaMetricsData.data.map(row => ({
        timestamp: row.hour,
        count: row.count,
      }));

      // Get performance metrics
      const performanceQuery = `
        SELECT 
          avg(dateDiff('second', min(timestamp), max(timestamp))) as avg_session_duration,
          avg(clickstack_pattern_confidence) as avg_pattern_confidence,
          avg(abs(clickstack_delta_percent)) as avg_delta_percent
        FROM (
          SELECT 
            clickstack_session_id,
            timestamp,
            clickstack_pattern_confidence,
            clickstack_delta_percent
          FROM default.logs 
          WHERE tenant_id = '${teamId}' ${timeFilter}
            AND clickstack_session_id != ''
        )
      `;

      const performanceResult = await this.clickhouse.query({
          query: performanceQuery,
          format: 'JSON'
        });

      return {
        sessions: {
          total: sessionMetricsData.data[0]?.total || 0,
          active: sessionMetricsData.data[0]?.active || 0,
          new: sessionMetricsData.data[0]?.new || 0,
          trend: sessionTrend,
        },
        patterns: {
          total: patternMetricsData.data[0]?.total || 0,
          highConfidence: patternMetricsData.data[0]?.high_confidence || 0,
          new: patternMetricsData.data[0]?.new || 0,
          trend: patternTrend,
        },
        eventDeltas: {
          total: (await deltaMetricsResult.json() as any).data[0]?.total || 0,
          anomalies: (await deltaMetricsResult.json() as any).data[0]?.anomalies || 0,
          new: (await deltaMetricsResult.json() as any).data[0]?.new || 0,
          trend: deltaTrend,
        },
        performance: {
          avgSessionDuration: (await performanceResult.json() as any).data[0]?.avg_session_duration || 0,
          avgPatternConfidence: (await performanceResult.json() as any).data[0]?.avg_pattern_confidence || 0,
          avgDeltaPercent: (await performanceResult.json() as any).data[0]?.avg_delta_percent || 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ClickStack sessions for dashboard
   */
  async getSessions(
    teamId: string,
    startTime?: string,
    endTime?: string,
    limit: number = 50
  ): Promise<ClickStackSession[]> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      const query = `
        SELECT 
          clickstack_session_id as sessionId,
          clickstack_user_id as userId,
          clickstack_page_url as pageUrl,
          clickstack_viewport as viewport,
          clickstack_user_agent as userAgent,
          clickstack_events as events,
          timestamp,
          dateDiff('second', min(timestamp), max(timestamp)) as duration,
          length(clickstack_events) as eventCount
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY 
          clickstack_session_id,
          clickstack_user_id,
          clickstack_page_url,
          clickstack_viewport,
          clickstack_user_agent,
          clickstack_events,
          timestamp
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      return (await result.json() as any).data.map(row => ({
        sessionId: row.sessionId,
        userId: row.userId,
        pageUrl: row.pageUrl,
        viewport: row.viewport || { width: 0, height: 0 },
        userAgent: row.userAgent,
        events: row.events || [],
        timestamp: row.timestamp,
        duration: row.duration || 0,
        eventCount: row.eventCount || 0,
      }));
    } catch (error) {
      throw new Error(`Failed to get sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ClickStack patterns for dashboard
   */
  async getPatterns(
    teamId: string,
    startTime?: string,
    endTime?: string,
    confidence: number = 0.8
  ): Promise<ClickStackPattern[]> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      const query = `
        SELECT 
          clickstack_pattern_id as patternId,
          clickstack_pattern_type as patternType,
          clickstack_pattern_confidence as confidence,
          clickstack_pattern_occurrences as occurrences,
          timestamp,
          clickstack_metadata as metadata
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND clickstack_pattern_confidence >= ${confidence}
        ORDER BY clickstack_pattern_confidence DESC, timestamp DESC
        LIMIT 50
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      return (await result.json() as any).data.map(row => ({
        patternId: row.patternId,
        patternType: row.patternType,
        confidence: row.confidence,
        occurrences: row.occurrences,
        timestamp: row.timestamp,
        metadata: row.metadata || {},
      }));
    } catch (error) {
      throw new Error(`Failed to get patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ClickStack event deltas for dashboard
   */
  async getEventDeltas(
    teamId: string,
    startTime?: string,
    endTime?: string,
    threshold: number = 10.0
  ): Promise<ClickStackEventDelta[]> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      const query = `
        SELECT 
          clickstack_baseline as baseline,
          clickstack_current as current,
          clickstack_delta_percent as deltaPercent,
          timestamp,
          clickstack_metadata as metadata
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND abs(clickstack_delta_percent) >= ${threshold}
        ORDER BY abs(clickstack_delta_percent) DESC, timestamp DESC
        LIMIT 50
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      return (await result.json() as any).data.map(row => ({
        baseline: row.baseline,
        current: row.current,
        deltaPercent: row.deltaPercent,
        timestamp: row.timestamp,
        metadata: row.metadata || {},
      }));
    } catch (error) {
      throw new Error(`Failed to get event deltas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build time filter for ClickHouse queries
   */
  private buildTimeFilter(startTime?: string, endTime?: string): string {
    if (!startTime && !endTime) {
      return '';
    }

    const filters: string[] = [];

    if (startTime) {
      filters.push(`timestamp >= '${startTime}'`);
    }

    if (endTime) {
      filters.push(`timestamp <= '${endTime}'`);
    }

    return filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';
  }
}

export const clickstackDashboardService = ClickStackDashboardService.getInstance();
