import { client } from '@/clickhouse';

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
  metadata?: Record<string, any>;
}

export interface ClickStackSessionEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
  position?: { x: number; y: number };
  element?: string;
  url?: string;
}

export interface ClickStackUserJourney {
  userId: string;
  sessions: ClickStackSession[];
  totalSessions: number;
  avgSessionDuration: number;
  mostVisitedPages: Array<{ pageUrl: string; count: number }>;
  commonPatterns: Array<{ pattern: string; count: number }>;
  conversionRate: number;
}

export interface ClickStackSessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  avgSessionDuration: number;
  topPages: Array<{ pageUrl: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  sessionTrends: Array<{ timestamp: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
}

export class ClickStackSessionService {
  private static instance: ClickStackSessionService;
  private clickhouse = client;

  private constructor() {
    // Use the singleton client instance
  }

  public static getInstance(): ClickStackSessionService {
    if (!ClickStackSessionService.instance) {
      ClickStackSessionService.instance = new ClickStackSessionService();
    }
    return ClickStackSessionService.instance;
  }

  /**
   * Get session by ID
   */
  async getSession(teamId: string, sessionId: string): Promise<ClickStackSession | null> {
    try {
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
          length(clickstack_events) as eventCount,
          clickstack_metadata as metadata
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_session_id = '${sessionId}'
        GROUP BY 
          clickstack_session_id,
          clickstack_user_id,
          clickstack_page_url,
          clickstack_viewport,
          clickstack_user_agent,
          clickstack_events,
          timestamp,
          clickstack_metadata
        LIMIT 1
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      const resultData = await result.json() as any;
      
      if (resultData.data.length === 0) {
        return null;
      }

      const row = resultData.data[0] as any;
      return {
        sessionId: row.sessionId,
        userId: row.userId,
        pageUrl: row.pageUrl,
        viewport: row.viewport || { width: 0, height: 0 },
        userAgent: row.userAgent,
        events: row.events || [],
        timestamp: row.timestamp,
        duration: row.duration || 0,
        eventCount: row.eventCount || 0,
        metadata: row.metadata || {},
      };
    } catch (error) {
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get session events
   */
  async getSessionEvents(
    teamId: string,
    sessionId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ClickStackSessionEvent[]> {
    try {
      const query = `
        SELECT 
          arrayJoin(clickstack_events) as eventData,
          timestamp
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_session_id = '${sessionId}'
        ORDER BY timestamp
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      const resultData = await result.json() as any;

      return resultData.data.map((row, index) => {
        const eventData = JSON.parse(row.eventData || '{}');
        return {
          eventId: `${sessionId}-${index}`,
          eventType: eventData.type || 'unknown',
          timestamp: row.timestamp,
          data: eventData,
          position: eventData.position || undefined,
          element: eventData.element || undefined,
          url: eventData.url || undefined,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get session events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(
    teamId: string,
    userId: string,
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
        WHERE tenant_id = '${teamId}' 
          AND clickstack_user_id = '${userId}' ${timeFilter}
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

      const resultData = await result.json() as any;

      return resultData.data.map((row: any) => ({
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
      throw new Error(`Failed to get user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new session
   */
  async createSession(teamId: string, sessionData: {
    sessionId: string;
    userId?: string;
    pageUrl: string;
    viewport?: { width: number; height: number };
    userAgent?: string;
    events?: any[];
  }): Promise<ClickStackSession> {
    try {
      // In a real implementation, you would insert the session data into ClickHouse
      // For now, we'll simulate the creation
      const session: ClickStackSession = {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId || 'anonymous',
        pageUrl: sessionData.pageUrl,
        viewport: sessionData.viewport || { width: 1920, height: 1080 },
        userAgent: sessionData.userAgent || 'Unknown',
        events: sessionData.events || [],
        timestamp: new Date().toISOString(),
        duration: 0,
        eventCount: sessionData.events?.length || 0,
      };

      // Simulate database insertion
      console.log(`Creating session ${sessionData.sessionId} for team ${teamId}`);

      return session;
    } catch (error) {
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user journey analysis
   */
  async getUserJourney(
    teamId: string,
    userId: string,
    startTime?: string,
    endTime?: string
  ): Promise<ClickStackUserJourney> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get user sessions
      const sessionsQuery = `
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
        WHERE tenant_id = '${teamId}' 
          AND clickstack_user_id = '${userId}' ${timeFilter}
        GROUP BY 
          clickstack_session_id,
          clickstack_user_id,
          clickstack_page_url,
          clickstack_viewport,
          clickstack_user_agent,
          clickstack_events,
          timestamp
        ORDER BY timestamp DESC
      `;

      const sessionsResult = await this.clickhouse.query({
          query: sessionsQuery,
          format: 'JSON'
        });
      const sessionsData = await sessionsResult.json() as any;
      const sessions = sessionsData.data.map((row: any) => ({
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

      // Get most visited pages
      const pagesQuery = `
        SELECT 
          clickstack_page_url as pageUrl,
          count() as count
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_user_id = '${userId}' ${timeFilter}
        GROUP BY clickstack_page_url
        ORDER BY count DESC
        LIMIT 10
      `;

      const pagesResult = await this.clickhouse.query({
          query: pagesQuery,
          format: 'JSON'
        });
      const pagesData = await pagesResult.json() as any;
      const mostVisitedPages = pagesData.data.map((row: any) => ({
        pageUrl: row.pageUrl,
        count: row.count,
      }));

      // Calculate analytics
      const totalSessions = sessions.length;
      const avgSessionDuration = sessions.length > 0 
        ? sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length 
        : 0;

      // Simulate common patterns and conversion rate
      const commonPatterns = [
        { pattern: 'home -> dashboard', count: 15 },
        { pattern: 'login -> dashboard', count: 12 },
        { pattern: 'search -> results', count: 8 },
      ];

      const conversionRate = 0.75; // 75% conversion rate

      return {
        userId,
        sessions,
        totalSessions,
        avgSessionDuration,
        mostVisitedPages,
        commonPatterns,
        conversionRate,
      };
    } catch (error) {
      throw new Error(`Failed to get user journey: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(
    teamId: string,
    startTime?: string,
    endTime?: string
  ): Promise<ClickStackSessionAnalytics> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get total sessions
      const totalSessionsQuery = `
        SELECT count() as total_sessions
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const totalSessionsResult = await this.clickhouse.query({
          query: totalSessionsQuery,
          format: 'JSON'
        });
      const totalSessionsData = await totalSessionsResult.json() as any;
      const totalSessions = (totalSessionsData.data[0] as any)?.total_sessions || 0;

      // Get active sessions (sessions in last hour)
      const activeSessionsQuery = `
        SELECT uniq(clickstack_session_id) as active_sessions
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND timestamp >= now() - INTERVAL 1 HOUR
      `;

      const activeSessionsResult = await this.clickhouse.query({
          query: activeSessionsQuery,
          format: 'JSON'
        });
      const activeSessionsData = await activeSessionsResult.json() as any;
      const activeSessions = (activeSessionsData.data[0] as any)?.active_sessions || 0;

      // Get average session duration
      const avgDurationQuery = `
        SELECT avg(dateDiff('second', min(timestamp), max(timestamp))) as avg_duration
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const avgDurationResult = await this.clickhouse.query({
          query: avgDurationQuery,
          format: 'JSON'
        });
      const avgDurationData = await avgDurationResult.json() as any;
      const avgSessionDuration = (avgDurationData.data[0] as any)?.avg_duration || 0;

      // Get top pages
      const topPagesQuery = `
        SELECT 
          clickstack_page_url as pageUrl,
          count() as count
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY clickstack_page_url
        ORDER BY count DESC
        LIMIT 10
      `;

      const topPagesResult = await this.clickhouse.query({
          query: topPagesQuery,
          format: 'JSON'
        });
      const topPagesData = await topPagesResult.json() as any;
      const topPages = topPagesData.data.map((row: any) => ({
        pageUrl: row.pageUrl,
        count: row.count,
      }));

      // Get top users
      const topUsersQuery = `
        SELECT 
          clickstack_user_id as userId,
          count() as count
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY clickstack_user_id
        ORDER BY count DESC
        LIMIT 10
      `;

      const topUsersResult = await this.clickhouse.query({
          query: topUsersQuery,
          format: 'JSON'
        });
      const topUsersData = await topUsersResult.json() as any;
      const topUsers = topUsersData.data.map((row: any) => ({
        userId: row.userId,
        count: row.count,
      }));

      // Get session trends
      const trendsQuery = `
        SELECT 
          toStartOfHour(timestamp) as hour,
          count() as count
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      const trendsResult = await this.clickhouse.query({
          query: trendsQuery,
          format: 'JSON'
        });
      const trendsData = await trendsResult.json() as any;
      const sessionTrends = trendsData.data.map((row: any) => ({
        timestamp: row.hour,
        count: row.count,
      }));

      // Simulate device breakdown
      const deviceBreakdown = [
        { device: 'Desktop', count: 1200 },
        { device: 'Mobile', count: 800 },
        { device: 'Tablet', count: 200 },
      ];

      return {
        totalSessions,
        activeSessions,
        avgSessionDuration,
        topPages,
        topUsers,
        sessionTrends,
        deviceBreakdown,
      };
    } catch (error) {
      throw new Error(`Failed to get session analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get session replay data
   */
  async getSessionReplay(
    teamId: string,
    sessionId: string
  ): Promise<{
    session: ClickStackSession;
    events: ClickStackSessionEvent[];
    timeline: Array<{ timestamp: string; event: string }>;
    heatmap: Array<{ x: number; y: number; count: number }>;
  }> {
    try {
      const session = await this.getSession(teamId, sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const events = await this.getSessionEvents(teamId, sessionId, 1000, 0);

      // Build timeline
      const timeline = events.map(event => ({
        timestamp: event.timestamp,
        event: event.eventType,
      }));

      // Simulate heatmap data
      const heatmap = events
        .filter(event => event.position)
        .map(event => ({
          x: event.position!.x,
          y: event.position!.y,
          count: 1,
        }))
        .reduce((acc, point) => {
          const existing = acc.find(p => p.x === point.x && p.y === point.y);
          if (existing) {
            existing.count++;
          } else {
            acc.push(point);
          }
          return acc;
        }, [] as Array<{ x: number; y: number; count: number }>);

      return {
        session,
        events,
        timeline,
        heatmap,
      };
    } catch (error) {
      throw new Error(`Failed to get session replay: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export const clickstackSessionService = ClickStackSessionService.getInstance();
