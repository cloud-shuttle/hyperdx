import { client } from '@/clickhouse';

export interface ClickStackPattern {
  patternId: string;
  patternType: string;
  confidence: number;
  occurrences: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface ClickStackPatternAnalysis {
  patternId: string;
  patternType: string;
  confidence: number;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: {
    affectedUsers: number;
    affectedSessions: number;
    errorRate: number;
    performanceImpact: number;
  };
  recommendations: string[];
}

export interface ClickStackPatternTrend {
  patternId: string;
  patternType: string;
  trend: Array<{ timestamp: string; occurrences: number; confidence: number }>;
  growthRate: number;
  seasonality: 'daily' | 'weekly' | 'monthly' | 'none';
  prediction: Array<{ timestamp: string; predictedOccurrences: number }>;
}

export interface ClickStackPatternCorrelation {
  patternId: string;
  correlatedPatterns: Array<{
    patternId: string;
    patternType: string;
    correlationStrength: number;
    confidence: number;
  }>;
  correlatedEvents: Array<{
    eventType: string;
    correlationStrength: number;
    frequency: number;
  }>;
  rootCause: {
    likely: string;
    confidence: number;
    evidence: string[];
  };
}

export class ClickStackPatternService {
  private static instance: ClickStackPatternService;
  private clickhouse = client;

  private constructor() {
    // Use the singleton client instance
  }

  public static getInstance(): ClickStackPatternService {
    if (!ClickStackPatternService.instance) {
      ClickStackPatternService.instance = new ClickStackPatternService();
    }
    return ClickStackPatternService.instance;
  }

  /**
   * Get pattern by ID
   */
  async getPattern(teamId: string, patternId: string): Promise<ClickStackPattern | null> {
    try {
      const query = `
        SELECT 
          clickstack_pattern_id as patternId,
          clickstack_pattern_type as patternType,
          clickstack_pattern_confidence as confidence,
          clickstack_pattern_occurrences as occurrences,
          timestamp,
          clickstack_metadata as metadata
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_pattern_id = '${patternId}'
        ORDER BY timestamp DESC
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
        patternId: row.patternId,
        patternType: row.patternType,
        confidence: row.confidence,
        occurrences: row.occurrences,
        timestamp: row.timestamp,
        metadata: row.metadata || {},
      };
    } catch (error) {
      throw new Error(`Failed to get pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get patterns by type
   */
  async getPatternsByType(
    teamId: string,
    patternType: string,
    startTime?: string,
    endTime?: string,
    confidence: number = 0.8,
    limit: number = 50
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
        WHERE tenant_id = '${teamId}' 
          AND clickstack_pattern_type = '${patternType}'
          AND clickstack_pattern_confidence >= ${confidence} ${timeFilter}
        ORDER BY clickstack_pattern_confidence DESC, timestamp DESC
        LIMIT ${limit}
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      const resultData = await result.json() as any;

      return resultData.data.map((row: any) => ({
        patternId: row.patternId,
        patternType: row.patternType,
        confidence: row.confidence,
        occurrences: row.occurrences,
        timestamp: row.timestamp,
        metadata: row.metadata || {},
      }));
    } catch (error) {
      throw new Error(`Failed to get patterns by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new pattern
   */
  async createPattern(teamId: string, patternData: {
    patternId: string;
    patternType: string;
    confidence: number;
    occurrences: number;
    metadata?: Record<string, any>;
  }): Promise<ClickStackPattern> {
    try {
      // In a real implementation, you would insert the pattern data into ClickHouse
      // For now, we'll simulate the creation
      const pattern: ClickStackPattern = {
        patternId: patternData.patternId,
        patternType: patternData.patternType,
        confidence: patternData.confidence,
        occurrences: patternData.occurrences,
        timestamp: new Date().toISOString(),
        metadata: patternData.metadata || {},
      };

      // Simulate database insertion
      console.log(`Creating pattern ${patternData.patternId} for team ${teamId}`);

      return pattern;
    } catch (error) {
      throw new Error(`Failed to create pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pattern analysis
   */
  async getPatternAnalysis(
    teamId: string,
    patternId: string
  ): Promise<ClickStackPatternAnalysis> {
    try {
      const pattern = await this.getPattern(teamId, patternId);
      if (!pattern) {
        throw new Error(`Pattern ${patternId} not found`);
      }

      // Get pattern history for analysis
      const historyQuery = `
        SELECT 
          min(timestamp) as first_seen,
          max(timestamp) as last_seen,
          count() as total_occurrences,
          avg(clickstack_pattern_confidence) as avg_confidence
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_pattern_id = '${patternId}'
      `;

      const historyResult = await this.clickhouse.query({
          query: historyQuery,
          format: 'JSON'
        });
      const historyData = await historyResult.json() as any;
      const history = historyData.data[0] as any;

      // Calculate frequency (occurrences per day)
      const firstSeen = new Date(history.first_seen);
      const lastSeen = new Date(history.last_seen);
      const daysDiff = Math.max(1, (lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      const frequency = history.total_occurrences / daysDiff;

      // Determine severity based on confidence and frequency
      let severity: 'low' | 'medium' | 'high' | 'critical';
      if (pattern.confidence >= 0.9 && frequency > 10) {
        severity = 'critical';
      } else if (pattern.confidence >= 0.8 && frequency > 5) {
        severity = 'high';
      } else if (pattern.confidence >= 0.7 && frequency > 2) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      // Simulate impact analysis
      const impact = {
        affectedUsers: Math.floor(pattern.occurrences * 0.3),
        affectedSessions: Math.floor(pattern.occurrences * 0.5),
        errorRate: pattern.confidence * 0.8,
        performanceImpact: pattern.confidence * 0.6,
      };

      // Generate recommendations based on pattern type and severity
      const recommendations = this.generateRecommendations(pattern.patternType, severity);

      return {
        patternId: pattern.patternId,
        patternType: pattern.patternType,
        confidence: pattern.confidence,
        occurrences: pattern.occurrences,
        firstSeen: history.first_seen,
        lastSeen: history.last_seen,
        frequency,
        severity,
        impact,
        recommendations,
      };
    } catch (error) {
      throw new Error(`Failed to get pattern analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pattern trends
   */
  async getPatternTrend(
    teamId: string,
    patternId: string,
    startTime?: string,
    endTime?: string
  ): Promise<ClickStackPatternTrend> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get trend data
      const trendQuery = `
        SELECT 
          toStartOfHour(timestamp) as hour,
          count() as occurrences,
          avg(clickstack_pattern_confidence) as confidence
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_pattern_id = '${patternId}' ${timeFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      const trendResult = await this.clickhouse.query({
          query: trendQuery,
          format: 'JSON'
        });
      const trendData = await trendResult.json() as any;
      const trend = trendData.data.map((row: any) => ({
        timestamp: row.hour,
        occurrences: row.occurrences,
        confidence: row.confidence,
      }));

      // Calculate growth rate
      const growthRate = trend.length > 1 
        ? (trend[trend.length - 1].occurrences - trend[0].occurrences) / trend[0].occurrences
        : 0;

      // Determine seasonality (simplified)
      const seasonality: 'daily' | 'weekly' | 'monthly' | 'none' = 
        trend.length > 24 ? 'daily' : 
        trend.length > 7 ? 'weekly' : 
        trend.length > 1 ? 'monthly' : 'none';

      // Generate predictions (simplified)
      const prediction = trend.slice(-5).map((point, index) => ({
        timestamp: new Date(new Date(point.timestamp).getTime() + (index + 1) * 60 * 60 * 1000).toISOString(),
        predictedOccurrences: Math.floor(point.occurrences * (1 + growthRate * 0.1)),
      }));

      // Get pattern type for the trend
      const pattern = await this.getPattern(teamId, patternId);
      const patternType = pattern?.patternType || 'unknown';

      return {
        patternId,
        patternType,
        trend,
        growthRate,
        seasonality,
        prediction,
      };
    } catch (error) {
      throw new Error(`Failed to get pattern trend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pattern correlations
   */
  async getPatternCorrelation(
    teamId: string,
    patternId: string
  ): Promise<ClickStackPatternCorrelation> {
    try {
      // Get correlated patterns
      const correlatedPatternsQuery = `
        SELECT 
          p2.clickstack_pattern_id as patternId,
          p2.clickstack_pattern_type as patternType,
          count() as correlation_count,
          avg(p2.clickstack_pattern_confidence) as confidence
        FROM clickstack_patterns p1
        JOIN clickstack_patterns p2 ON p1.timestamp = p2.timestamp
        WHERE p1.tenant_id = '${teamId}' 
          AND p1.clickstack_pattern_id = '${patternId}'
          AND p2.tenant_id = '${teamId}' 
          AND p2.clickstack_pattern_id != '${patternId}'
        GROUP BY p2.clickstack_pattern_id, p2.clickstack_pattern_type
        ORDER BY correlation_count DESC
        LIMIT 10
      `;

      const correlatedPatternsResult = await this.clickhouse.query({
          query: correlatedPatternsQuery,
          format: 'JSON'
        });
      const correlatedPatternsData = await correlatedPatternsResult.json() as any;
      const correlatedPatterns = correlatedPatternsData.data.map((row: any) => ({
        patternId: row.patternId,
        patternType: row.patternType,
        correlationStrength: row.correlation_count / 100, // Normalize
        confidence: row.confidence,
      }));

      // Simulate correlated events
      const correlatedEvents = [
        { eventType: 'error', correlationStrength: 0.85, frequency: 120 },
        { eventType: 'timeout', correlationStrength: 0.72, frequency: 45 },
        { eventType: 'slow_query', correlationStrength: 0.68, frequency: 30 },
      ];

      // Simulate root cause analysis
      const rootCause = {
        likely: 'Database connection pool exhaustion',
        confidence: 0.78,
        evidence: [
          'High correlation with timeout events',
          'Pattern occurs during peak usage hours',
          'Consistent with connection pool metrics',
        ],
      };

      return {
        patternId,
        correlatedPatterns,
        correlatedEvents,
        rootCause,
      };
    } catch (error) {
      throw new Error(`Failed to get pattern correlation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pattern statistics
   */
  async getPatternStats(
    teamId: string,
    startTime?: string,
    endTime?: string
  ): Promise<{
    totalPatterns: number;
    highConfidencePatterns: number;
    patternTypes: Array<{ type: string; count: number }>;
    confidenceDistribution: Array<{ range: string; count: number }>;
    topPatterns: Array<{ patternId: string; patternType: string; occurrences: number }>;
  }> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get total patterns
      const totalQuery = `
        SELECT count() as total_patterns
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const totalResult = await this.clickhouse.query({
          query: totalQuery,
          format: 'JSON'
        });
      const totalData = await totalResult.json() as any;
      const totalPatterns = (totalData.data[0] as any)?.total_patterns || 0;

      // Get high confidence patterns
      const highConfidenceQuery = `
        SELECT count() as high_confidence_patterns
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND clickstack_pattern_confidence >= 0.8
      `;

      const highConfidenceResult = await this.clickhouse.query({
          query: highConfidenceQuery,
          format: 'JSON'
        });
      const highConfidenceData = await highConfidenceResult.json() as any;
      const highConfidencePatterns = (highConfidenceData.data[0] as any)?.high_confidence_patterns || 0;

      // Get pattern types
      const typesQuery = `
        SELECT 
          clickstack_pattern_type as type,
          count() as count
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY clickstack_pattern_type
        ORDER BY count DESC
      `;

      const typesResult = await this.clickhouse.query({
          query: typesQuery,
          format: 'JSON'
        });
      const typesData = await typesResult.json() as any;
      const patternTypes = typesData.data.map((row: any) => ({
        type: row.type,
        count: row.count,
      }));

      // Get confidence distribution
      const confidenceQuery = `
        SELECT 
          CASE 
            WHEN clickstack_pattern_confidence >= 0.9 THEN '0.9-1.0'
            WHEN clickstack_pattern_confidence >= 0.8 THEN '0.8-0.9'
            WHEN clickstack_pattern_confidence >= 0.7 THEN '0.7-0.8'
            ELSE '0.0-0.7'
          END as range,
          count() as count
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY range
        ORDER BY range DESC
      `;

      const confidenceResult = await this.clickhouse.query({
          query: confidenceQuery,
          format: 'JSON'
        });
      const confidenceData = await confidenceResult.json() as any;
      const confidenceDistribution = confidenceData.data.map((row: any) => ({
        range: row.range,
        count: row.count,
      }));

      // Get top patterns
      const topPatternsQuery = `
        SELECT 
          clickstack_pattern_id as patternId,
          clickstack_pattern_type as patternType,
          sum(clickstack_pattern_occurrences) as occurrences
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY clickstack_pattern_id, clickstack_pattern_type
        ORDER BY occurrences DESC
        LIMIT 10
      `;

      const topPatternsResult = await this.clickhouse.query({
          query: topPatternsQuery,
          format: 'JSON'
        });
      const topPatternsData = await topPatternsResult.json() as any;
      const topPatterns = topPatternsData.data.map((row: any) => ({
        patternId: row.patternId,
        patternType: row.patternType,
        occurrences: row.occurrences,
      }));

      return {
        totalPatterns,
        highConfidencePatterns,
        patternTypes,
        confidenceDistribution,
        topPatterns,
      };
    } catch (error) {
      throw new Error(`Failed to get pattern stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate recommendations based on pattern type and severity
   */
  private generateRecommendations(patternType: string, severity: string): string[] {
    const recommendations: string[] = [];

    switch (patternType.toLowerCase()) {
      case 'error':
        if (severity === 'critical' || severity === 'high') {
          recommendations.push('Immediately investigate error source and implement fix');
          recommendations.push('Add error monitoring and alerting');
          recommendations.push('Review error handling in affected components');
        } else {
          recommendations.push('Monitor error frequency and investigate if it increases');
          recommendations.push('Consider adding error recovery mechanisms');
        }
        break;

      case 'performance':
        if (severity === 'critical' || severity === 'high') {
          recommendations.push('Optimize database queries and add caching');
          recommendations.push('Implement performance monitoring and alerting');
          recommendations.push('Consider scaling infrastructure');
        } else {
          recommendations.push('Monitor performance metrics closely');
          recommendations.push('Identify performance bottlenecks');
        }
        break;

      case 'security':
        recommendations.push('Immediately investigate potential security issue');
        recommendations.push('Review access controls and authentication');
        recommendations.push('Implement security monitoring and alerting');
        break;

      case 'user_behavior':
        recommendations.push('Analyze user journey and identify friction points');
        recommendations.push('Consider UX improvements based on pattern');
        recommendations.push('Monitor conversion rates and user satisfaction');
        break;

      default:
        recommendations.push('Monitor pattern frequency and investigate root cause');
        recommendations.push('Consider implementing automated detection');
    }

    return recommendations;
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

export const clickstackPatternService = ClickStackPatternService.getInstance();
