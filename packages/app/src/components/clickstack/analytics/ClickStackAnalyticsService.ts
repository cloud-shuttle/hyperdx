import { client } from '@/clickhouse';

interface AnalyticsQueryParams {
  teamId: string;
  timeRange: string;
  startTime?: string;
  endTime?: string;
  filters?: Record<string, any>;
}

interface TrendData {
  date: string;
  value: number;
  change: number;
  changePercent: number;
}

interface PerformanceMetrics {
  avgLoadTime: number;
  avgResponseTime: number;
  p95LoadTime: number;
  p95ResponseTime: number;
  errorRate: number;
  slowestPages: Array<{
    page: string;
    avgLoadTime: number;
    requestCount: number;
  }>;
}

interface UserBehaviorMetrics {
  topPages: Array<{
    page: string;
    visits: number;
    uniqueUsers: number;
    avgTimeOnPage: number;
  }>;
  userJourneys: Array<{
    journey: string;
    users: number;
    conversionRate: number;
    avgSteps: number;
  }>;
  deviceTypes: Array<{
    device: string;
    percentage: number;
    sessions: number;
  }>;
  browsers: Array<{
    browser: string;
    percentage: number;
    sessions: number;
  }>;
}

interface PatternMetrics {
  totalPatterns: number;
  highConfidence: number;
  criticalPatterns: number;
  recentPatterns: Array<{
    pattern: string;
    confidence: number;
    impact: number;
    frequency: number;
  }>;
}

interface AnomalyMetrics {
  totalAnomalies: number;
  criticalAnomalies: number;
  recentAnomalies: Array<{
    metric: string;
    delta: number;
    severity: string;
    timestamp: string;
  }>;
}

interface SessionMetrics {
  totalSessions: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  conversionRate: number;
  errorRate: number;
  engagementScore: number;
}

export class ClickStackAnalyticsService {
  private static instance: ClickStackAnalyticsService;

  private constructor() {}

  public static getInstance(): ClickStackAnalyticsService {
    if (!ClickStackAnalyticsService.instance) {
      ClickStackAnalyticsService.instance = new ClickStackAnalyticsService();
    }
    return ClickStackAnalyticsService.instance;
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardAnalytics(params: AnalyticsQueryParams) {
    const [
      sessionMetrics,
      performanceMetrics,
      userBehaviorMetrics,
      patternMetrics,
      anomalyMetrics,
      trends
    ] = await Promise.all([
      this.getSessionMetrics(params),
      this.getPerformanceMetrics(params),
      this.getUserBehaviorMetrics(params),
      this.getPatternMetrics(params),
      this.getAnomalyMetrics(params),
      this.getTrends(params)
    ]);

    return {
      overview: sessionMetrics,
      performance: performanceMetrics,
      userBehavior: userBehaviorMetrics,
      patterns: patternMetrics,
      anomalies: anomalyMetrics,
      trends
    };
  }

  /**
   * Get session metrics and KPIs
   */
  async getSessionMetrics(params: AnalyticsQueryParams): Promise<SessionMetrics> {
    const timeFilter = this.buildTimeFilter(params);
    
    const query = `
      SELECT 
        count() as totalSessions,
        uniqExact(clickstack_user_id) as uniqueUsers,
        avg(clickstack_session_duration) as avgSessionDuration,
        sum(clickstack_conversion) / count() as conversionRate,
        sum(clickstack_error_count) / count() as errorRate,
        avg(clickstack_engagement_score) as engagementScore
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_session_id IS NOT NULL
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId: params.teamId
      }
    });

    const row = await result.json();
    return row[0] || {
      totalSessions: 0,
      uniqueUsers: 0,
      avgSessionDuration: 0,
      conversionRate: 0,
      errorRate: 0,
      engagementScore: 0
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(params: AnalyticsQueryParams): Promise<PerformanceMetrics> {
    const timeFilter = this.buildTimeFilter(params);
    
    const query = `
      SELECT 
        avg(clickstack_load_time) as avgLoadTime,
        avg(clickstack_response_time) as avgResponseTime,
        quantile(0.95)(clickstack_load_time) as p95LoadTime,
        quantile(0.95)(clickstack_response_time) as p95ResponseTime,
        sum(clickstack_error_count) / count() as errorRate
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_load_time IS NOT NULL
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId: params.teamId
      }
    });

    const row = await result.json();
    const metrics = row[0] || {
      avgLoadTime: 0,
      avgResponseTime: 0,
      p95LoadTime: 0,
      p95ResponseTime: 0,
      errorRate: 0
    };

    // Get slowest pages
    const slowestPagesQuery = `
      SELECT 
        clickstack_page_url as page,
        avg(clickstack_load_time) as avgLoadTime,
        count() as requestCount
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_page_url IS NOT NULL
      GROUP BY clickstack_page_url
      ORDER BY avgLoadTime DESC
      LIMIT 10
    `;

    const slowestPagesResult = await client.query({
      query: slowestPagesQuery,
      query_params: {
        teamId: params.teamId
      }
    });

    const slowestPages = await slowestPagesResult.json();

    return {
      ...metrics,
      slowestPages: slowestPages.map((page: any) => ({
        page: page.page,
        avgLoadTime: page.avgLoadTime,
        requestCount: page.requestCount
      }))
    };
  }

  /**
   * Get user behavior metrics
   */
  async getUserBehaviorMetrics(params: AnalyticsQueryParams): Promise<UserBehaviorMetrics> {
    const timeFilter = this.buildTimeFilter(params);
    
    // Get top pages
    const topPagesQuery = `
      SELECT 
        clickstack_page_url as page,
        count() as visits,
        uniqExact(clickstack_user_id) as uniqueUsers,
        avg(clickstack_time_on_page) as avgTimeOnPage
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_page_url IS NOT NULL
      GROUP BY clickstack_page_url
      ORDER BY visits DESC
      LIMIT 10
    `;

    const topPagesResult = await client.query({
      query: topPagesQuery,
      query_params: {
        teamId: params.teamId
      }
    });

    const topPages = await topPagesResult.json();

    // Get device types
    const deviceTypesQuery = `
      SELECT 
        clickstack_device_type as device,
        count() as sessions,
        count() / sum(count()) OVER () * 100 as percentage
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_device_type IS NOT NULL
      GROUP BY clickstack_device_type
      ORDER BY sessions DESC
    `;

    const deviceTypesResult = await client.query({
      query: deviceTypesQuery,
      query_params: {
        teamId: params.teamId
      }
    });

    const deviceTypes = await deviceTypesResult.json();

    // Get browsers
    const browsersQuery = `
      SELECT 
        clickstack_browser as browser,
        count() as sessions,
        count() / sum(count()) OVER () * 100 as percentage
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_browser IS NOT NULL
      GROUP BY clickstack_browser
      ORDER BY sessions DESC
      LIMIT 10
    `;

    const browsersResult = await client.query({
      query: browsersQuery,
      query_params: {
        teamId: params.teamId
      }
    });

    const browsers = await browsersResult.json();

    return {
      topPages: topPages.map((page: any) => ({
        page: page.page,
        visits: page.visits,
        uniqueUsers: page.uniqueUsers,
        avgTimeOnPage: page.avgTimeOnPage
      })),
      userJourneys: [], // TODO: Implement user journey analysis
      deviceTypes: deviceTypes.map((device: any) => ({
        device: device.device,
        percentage: device.percentage,
        sessions: device.sessions
      })),
      browsers: browsers.map((browser: any) => ({
        browser: browser.browser,
        percentage: browser.percentage,
        sessions: browser.sessions
      }))
    };
  }

  /**
   * Get pattern metrics
   */
  async getPatternMetrics(params: AnalyticsQueryParams): Promise<PatternMetrics> {
    const timeFilter = this.buildTimeFilter(params);
    
    const query = `
      SELECT 
        count() as totalPatterns,
        sum(if(clickstack_pattern_confidence > 0.8, 1, 0)) as highConfidence,
        sum(if(clickstack_pattern_severity = 'critical', 1, 0)) as criticalPatterns
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_pattern_id IS NOT NULL
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId: params.teamId
      }
    });

    const row = await result.json();
    const metrics = row[0] || {
      totalPatterns: 0,
      highConfidence: 0,
      criticalPatterns: 0
    };

    // Get recent patterns
    const recentPatternsQuery = `
      SELECT 
        clickstack_pattern_name as pattern,
        avg(clickstack_pattern_confidence) as confidence,
        avg(clickstack_pattern_impact) as impact,
        count() as frequency
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_pattern_id IS NOT NULL
      GROUP BY clickstack_pattern_name
      ORDER BY frequency DESC
      LIMIT 10
    `;

    const recentPatternsResult = await client.query({
      query: recentPatternsQuery,
      query_params: {
        teamId: params.teamId
      }
    });

    const recentPatterns = await recentPatternsResult.json();

    return {
      ...metrics,
      recentPatterns: recentPatterns.map((pattern: any) => ({
        pattern: pattern.pattern,
        confidence: pattern.confidence,
        impact: pattern.impact,
        frequency: pattern.frequency
      }))
    };
  }

  /**
   * Get anomaly metrics
   */
  async getAnomalyMetrics(params: AnalyticsQueryParams): Promise<AnomalyMetrics> {
    const timeFilter = this.buildTimeFilter(params);
    
    const query = `
      SELECT 
        count() as totalAnomalies,
        sum(if(clickstack_anomaly_severity = 'critical', 1, 0)) as criticalAnomalies
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_anomaly_id IS NOT NULL
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId: params.teamId
      }
    });

    const row = await result.json();
    const metrics = row[0] || {
      totalAnomalies: 0,
      criticalAnomalies: 0
    };

    // Get recent anomalies
    const recentAnomaliesQuery = `
      SELECT 
        clickstack_anomaly_metric as metric,
        avg(clickstack_anomaly_delta) as delta,
        clickstack_anomaly_severity as severity,
        max(timestamp) as timestamp
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_anomaly_id IS NOT NULL
      GROUP BY clickstack_anomaly_metric, clickstack_anomaly_severity
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    const recentAnomaliesResult = await client.query({
      query: recentAnomaliesQuery,
      query_params: {
        teamId: params.teamId
      }
    });

    const recentAnomalies = await recentAnomaliesResult.json();

    return {
      ...metrics,
      recentAnomalies: recentAnomalies.map((anomaly: any) => ({
        metric: anomaly.metric,
        delta: anomaly.delta,
        severity: anomaly.severity,
        timestamp: anomaly.timestamp
      }))
    };
  }

  /**
   * Get trend data for various metrics
   */
  async getTrends(params: AnalyticsQueryParams) {
    const timeFilter = this.buildTimeFilter(params);
    
    // Get session trends
    const sessionsQuery = `
      SELECT 
        toDate(timestamp) as date,
        count() as count
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_session_id IS NOT NULL
      GROUP BY toDate(timestamp)
      ORDER BY date
    `;

    const sessionsResult = await client.query({
      query: sessionsQuery,
      query_params: {
        teamId: params.teamId
      }
    });

    const sessions = await sessionsResult.json();

    // Get conversion trends
    const conversionsQuery = `
      SELECT 
        toDate(timestamp) as date,
        sum(clickstack_conversion) / count() as rate
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_session_id IS NOT NULL
      GROUP BY toDate(timestamp)
      ORDER BY date
    `;

    const conversionsResult = await client.query({
      query: conversionsQuery,
      query_params: {
        teamId: params.teamId
      }
    });

    const conversions = await conversionsResult.json();

    return {
      sessions: sessions.map((item: any) => ({
        date: item.date,
        count: item.count
      })),
      conversions: conversions.map((item: any) => ({
        date: item.date,
        rate: item.rate
      })),
      users: [], // TODO: Implement user trends
      errors: [] // TODO: Implement error trends
    };
  }

  /**
   * Get real-time analytics for live monitoring
   */
  async getRealTimeAnalytics(params: AnalyticsQueryParams) {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const query = `
      SELECT 
        count() as activeSessions,
        uniqExact(clickstack_user_id) as activeUsers,
        avg(clickstack_response_time) as avgResponseTime,
        sum(clickstack_error_count) as errorCount
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND timestamp >= {fiveMinutesAgo:DateTime}
        AND clickstack_session_id IS NOT NULL
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId: params.teamId,
        fiveMinutesAgo: fiveMinutesAgo.toISOString()
      }
    });

    const row = await result.json();
    return row[0] || {
      activeSessions: 0,
      activeUsers: 0,
      avgResponseTime: 0,
      errorCount: 0
    };
  }

  /**
   * Get predictive insights based on historical data
   */
  async getPredictiveInsights(params: AnalyticsQueryParams) {
    // TODO: Implement predictive analytics using machine learning models
    return {
      predictedSessions: 0,
      predictedConversionRate: 0,
      predictedErrors: 0,
      recommendations: []
    };
  }

  /**
   * Build time filter based on time range
   */
  private buildTimeFilter(params: AnalyticsQueryParams): string {
    if (params.startTime && params.endTime) {
      return `timestamp >= {startTime:DateTime} AND timestamp <= {endTime:DateTime}`;
    }

    const now = new Date();
    let startTime: Date;

    switch (params.timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return `timestamp >= {startTime:DateTime}`;
  }

  /**
   * Export analytics data for external use
   */
  async exportAnalyticsData(params: AnalyticsQueryParams, format: 'json' | 'csv' = 'json') {
    const data = await this.getDashboardAnalytics(params);
    
    if (format === 'csv') {
      // TODO: Implement CSV export
      return this.convertToCSV(data);
    }
    
    return data;
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    // TODO: Implement CSV conversion
    return '';
  }
}

// Export singleton instance
export const clickStackAnalyticsService = ClickStackAnalyticsService.getInstance();
