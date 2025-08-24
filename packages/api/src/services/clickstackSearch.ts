import { client } from '@/clickhouse';

export interface ClickStackSearchParams {
  query: string;
  startTime?: string;
  endTime?: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface ClickStackSearchResult {
  logs: any[];
  traces: any[];
  metrics: any[];
  sessions: any[];
  patterns: any[];
  eventDeltas: any[];
  total: number;
  query: string;
  executionTime: number;
  facets: Record<string, any[]>;
}

export interface ClickStackSessionSearchParams {
  userId?: string;
  sessionId?: string;
  pageUrl?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface ClickStackPatternSearchParams {
  patternType?: string;
  confidence?: number;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface ClickStackSearchAnalytics {
  totalQueries: number;
  avgExecutionTime: number;
  topQueries: Array<{ query: string; count: number }>;
  searchTrends: Array<{ timestamp: string; count: number }>;
  popularFilters: Array<{ filter: string; count: number }>;
}

export class ClickStackSearchService {
  private static instance: ClickStackSearchService;
  private clickhouse = client;

  private constructor() {
    // Use the singleton client instance
  }

  public static getInstance(): ClickStackSearchService {
    if (!ClickStackSearchService.instance) {
      ClickStackSearchService.instance = new ClickStackSearchService();
    }
    return ClickStackSearchService.instance;
  }

  /**
   * Search ClickStack data across all telemetry types
   */
  async search(
    teamId: string,
    query: string,
    params: ClickStackSearchParams
  ): Promise<ClickStackSearchResult> {
    const startTime = Date.now();
    
    try {
      const timeFilter = this.buildTimeFilter(params.startTime, params.endTime);
      const limit = params.limit || 100;
      const offset = params.offset || 0;

      // Build search conditions
      const searchConditions = this.buildSearchConditions(query, params.filters);

      // Search logs
      const logsQuery = `
        SELECT 
          timestamp,
          body,
          clickstack_metadata,
          clickstack_session_id,
          clickstack_pattern_id,
          clickstack_correlation_id,
          tenant_id
        FROM default.logs 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND (${searchConditions.logs})
        ORDER BY timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const logsResult = await this.clickhouse.query({
          query: logsQuery,
          format: 'JSON'
        });

      // Search traces
      const tracesQuery = `
        SELECT 
          timestamp,
          span_name,
          span_id,
          trace_id,
          clickstack_metadata,
          clickstack_correlation_id,
          tenant_id
        FROM default.traces 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND (${searchConditions.traces})
        ORDER BY timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const tracesResult = await this.clickhouse.query({
          query: tracesQuery,
          format: 'JSON'
        });

      // Search metrics
      const metricsQuery = `
        SELECT 
          timestamp,
          metric_name,
          metric_value,
          clickstack_metadata,
          clickstack_correlation_id,
          tenant_id
        FROM default.metric_stream 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND (${searchConditions.metrics})
        ORDER BY timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const metricsResult = await this.clickhouse.query({
          query: metricsQuery,
          format: 'JSON'
        });

      // Search sessions
      const sessionsQuery = `
        SELECT 
          clickstack_session_id,
          clickstack_user_id,
          clickstack_page_url,
          clickstack_viewport,
          clickstack_user_agent,
          clickstack_events,
          timestamp
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND (${searchConditions.sessions})
        ORDER BY timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const sessionsResult = await this.clickhouse.query({
          query: sessionsQuery,
          format: 'JSON'
        });

      // Search patterns
      const patternsQuery = `
        SELECT 
          clickstack_pattern_id,
          clickstack_pattern_type,
          clickstack_pattern_confidence,
          clickstack_pattern_occurrences,
          timestamp,
          clickstack_metadata
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND (${searchConditions.patterns})
        ORDER BY clickstack_pattern_confidence DESC, timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const patternsResult = await this.clickhouse.query({
          query: patternsQuery,
          format: 'JSON'
        });

      // Search event deltas
      const deltasQuery = `
        SELECT 
          clickstack_baseline,
          clickstack_current,
          clickstack_delta_percent,
          timestamp,
          clickstack_metadata
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND (${searchConditions.eventDeltas})
        ORDER BY abs(clickstack_delta_percent) DESC, timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const deltasResult = await this.clickhouse.query({
          query: deltasQuery,
          format: 'JSON'
        });

      // Get facets for search results
      const facets = await this.getSearchFacets(teamId, query, timeFilter);

      const executionTime = Date.now() - startTime;

      return {
        logs: logsResult.json().data,
        traces: tracesResult.json().data,
        metrics: metricsResult.json().data,
        sessions: sessionsResult.json().data,
        patterns: patternsResult.json().data,
        eventDeltas: deltasResult.json().data,
        total: logsResult.json().data.length + tracesResult.json().data.length + metricsResult.json().data.length + 
               sessionsResult.json().data.length + patternsResult.json().data.length + deltasResult.json().data.length,
        query,
        executionTime,
        facets,
      };
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search ClickStack sessions
   */
  async searchSessions(
    teamId: string,
    params: ClickStackSessionSearchParams
  ): Promise<ClickStackSearchResult> {
    try {
      const timeFilter = this.buildTimeFilter(params.startTime, params.endTime);
      const limit = params.limit || 50;
      const offset = params.offset || 0;

      const conditions: string[] = [`tenant_id = '${teamId}'`];

      if (params.userId) {
        conditions.push(`clickstack_user_id = '${params.userId}'`);
      }

      if (params.sessionId) {
        conditions.push(`clickstack_session_id = '${params.sessionId}'`);
      }

      if (params.pageUrl) {
        conditions.push(`clickstack_page_url LIKE '%${params.pageUrl}%'`);
      }

      const whereClause = conditions.join(' AND ');

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
        WHERE ${whereClause} ${timeFilter}
        GROUP BY 
          clickstack_session_id,
          clickstack_user_id,
          clickstack_page_url,
          clickstack_viewport,
          clickstack_user_agent,
          clickstack_events,
          timestamp
        ORDER BY timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      return {
        sessions: result.json().data.map(row => ({
          sessionId: row.sessionId,
          userId: row.userId,
          pageUrl: row.pageUrl,
          viewport: row.viewport || { width: 0, height: 0 },
          userAgent: row.userAgent,
          events: row.events || [],
          timestamp: row.timestamp,
          duration: row.duration || 0,
          eventCount: row.eventCount || 0,
        })),
        total: result.json().data.length,
        query: 'session_search',
        executionTime: 0,
        facets: {},
      };
    } catch (error) {
      throw new Error(`Session search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search ClickStack patterns
   */
  async searchPatterns(
    teamId: string,
    params: ClickStackPatternSearchParams
  ): Promise<ClickStackSearchResult> {
    try {
      const timeFilter = this.buildTimeFilter(params.startTime, params.endTime);
      const limit = params.limit || 50;
      const offset = params.offset || 0;

      const conditions: string[] = [`tenant_id = '${teamId}'`];

      if (params.patternType) {
        conditions.push(`clickstack_pattern_type = '${params.patternType}'`);
      }

      if (params.confidence) {
        conditions.push(`clickstack_pattern_confidence >= ${params.confidence}`);
      }

      const whereClause = conditions.join(' AND ');

      const query = `
        SELECT 
          clickstack_pattern_id as patternId,
          clickstack_pattern_type as patternType,
          clickstack_pattern_confidence as confidence,
          clickstack_pattern_occurrences as occurrences,
          timestamp,
          clickstack_metadata as metadata
        FROM clickstack_patterns 
        WHERE ${whereClause} ${timeFilter}
        ORDER BY clickstack_pattern_confidence DESC, timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      return {
        patterns: result.json().data.map(row => ({
          patternId: row.patternId,
          patternType: row.patternType,
          confidence: row.confidence,
          occurrences: row.occurrences,
          timestamp: row.timestamp,
          metadata: row.metadata || {},
        })),
        total: result.json().data.length,
        query: 'pattern_search',
        executionTime: 0,
        facets: {},
      };
    } catch (error) {
      throw new Error(`Pattern search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(
    teamId: string,
    startTime?: string,
    endTime?: string
  ): Promise<ClickStackSearchAnalytics> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get total queries (simulated - in real implementation, you'd track search queries)
      const totalQueriesQuery = `
        SELECT count() as total_queries
        FROM default.logs 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND clickstack_metadata['search_query'] != ''
      `;

      const totalQueriesResult = await this.clickhouse.query({
          query: totalQueriesQuery,
          format: 'JSON'
        });
      const totalQueries = totalQueriesResult.json().data[0]?.total_queries || 0;

      // Get search trends
      const trendsQuery = `
        SELECT 
          toStartOfHour(timestamp) as hour,
          count() as count
        FROM default.logs 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND clickstack_metadata['search_query'] != ''
        GROUP BY hour
        ORDER BY hour
      `;

      const trendsResult = await this.clickhouse.query({
          query: trendsQuery,
          format: 'JSON'
        });
      const searchTrends = trendsResult.json().data.map(row => ({
        timestamp: row.hour,
        count: row.count,
      }));

      // Get popular filters (simulated)
      const popularFilters = [
        { filter: 'session_replay', count: 150 },
        { filter: 'pattern_recognition', count: 120 },
        { filter: 'event_delta', count: 80 },
        { filter: 'error_patterns', count: 60 },
      ];

      // Get top queries (simulated)
      const topQueries = [
        { query: 'error', count: 200 },
        { query: 'session', count: 180 },
        { query: 'pattern', count: 150 },
        { query: 'performance', count: 120 },
      ];

      return {
        totalQueries,
        avgExecutionTime: 45, // Simulated average execution time in ms
        topQueries,
        searchTrends,
        popularFilters,
      };
    } catch (error) {
      throw new Error(`Search analytics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build search conditions for different data types
   */
  private buildSearchConditions(query: string, filters?: Record<string, any>): {
    logs: string;
    traces: string;
    metrics: string;
    sessions: string;
    patterns: string;
    eventDeltas: string;
  } {
    const baseConditions = [`body LIKE '%${query}%'`];

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (typeof value === 'string') {
          baseConditions.push(`clickstack_metadata['${key}'] = '${value}'`);
        } else if (typeof value === 'number') {
          baseConditions.push(`clickstack_metadata['${key}'] = ${value}`);
        }
      });
    }

    const baseCondition = baseConditions.join(' OR ');

    return {
      logs: baseCondition,
      traces: `span_name LIKE '%${query}%' OR trace_id LIKE '%${query}%'`,
      metrics: `metric_name LIKE '%${query}%'`,
      sessions: `clickstack_page_url LIKE '%${query}%' OR clickstack_user_id LIKE '%${query}%'`,
      patterns: `clickstack_pattern_type LIKE '%${query}%'`,
      eventDeltas: `clickstack_metadata LIKE '%${query}%'`,
    };
  }

  /**
   * Get search facets for analytics
   */
  private async getSearchFacets(
    teamId: string,
    query: string,
    timeFilter: string
  ): Promise<Record<string, any[]>> {
    try {
      // Get session facets
      const sessionFacetsQuery = `
        SELECT 
          clickstack_page_url as pageUrl,
          count() as count
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND clickstack_page_url LIKE '%${query}%'
        GROUP BY clickstack_page_url
        ORDER BY count DESC
        LIMIT 10
      `;

      const sessionFacetsResult = await this.clickhouse.query({
          query: sessionFacetsQuery,
          format: 'JSON'
        });

      // Get pattern facets
      const patternFacetsQuery = `
        SELECT 
          clickstack_pattern_type as patternType,
          count() as count
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND clickstack_pattern_type LIKE '%${query}%'
        GROUP BY clickstack_pattern_type
        ORDER BY count DESC
        LIMIT 10
      `;

      const patternFacetsResult = await this.clickhouse.query({
          query: patternFacetsQuery,
          format: 'JSON'
        });

      // Get user facets
      const userFacetsQuery = `
        SELECT 
          clickstack_user_id as userId,
          count() as count
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND clickstack_user_id LIKE '%${query}%'
        GROUP BY clickstack_user_id
        ORDER BY count DESC
        LIMIT 10
      `;

      const userFacetsResult = await this.clickhouse.query({
          query: userFacetsQuery,
          format: 'JSON'
        });

      return {
        pages: sessionFacetsResult.json().data,
        patterns: patternFacetsResult.json().data,
        users: userFacetsResult.json().data,
      };
    } catch (error) {
      console.error('Failed to get search facets:', error);
      return {
        pages: [],
        patterns: [],
        users: [],
      };
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

export const clickstackSearchService = ClickStackSearchService.getInstance();
