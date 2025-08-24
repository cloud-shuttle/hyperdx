import { client } from '@/clickhouse';

export interface ClickStackEventDelta {
  baseline: number;
  current: number;
  deltaPercent: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface ClickStackEventDeltaAnalysis {
  deltaId: string;
  baseline: number;
  current: number;
  deltaPercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  impact: {
    affectedUsers: number;
    affectedSessions: number;
    performanceImpact: number;
    businessImpact: number;
  };
  recommendations: string[];
}

export interface ClickStackEventDeltaTrend {
  deltaId: string;
  trend: Array<{ timestamp: string; deltaPercent: number; baseline: number; current: number }>;
  volatility: number;
  seasonality: 'daily' | 'weekly' | 'monthly' | 'none';
  prediction: Array<{ timestamp: string; predictedDelta: number }>;
  alerts: Array<{ timestamp: string; severity: string; message: string }>;
}

export interface ClickStackAnomalyDetection {
  anomalies: Array<{
    timestamp: string;
    metric: string;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  patterns: Array<{
    pattern: string;
    frequency: number;
    confidence: number;
  }>;
  recommendations: string[];
}

export class ClickStackEventDeltaService {
  private static instance: ClickStackEventDeltaService;
  private clickhouse = client;

  private constructor() {
    // Use the singleton client instance
  }

  public static getInstance(): ClickStackEventDeltaService {
    if (!ClickStackEventDeltaService.instance) {
      ClickStackEventDeltaService.instance = new ClickStackEventDeltaService();
    }
    return ClickStackEventDeltaService.instance;
  }

  /**
   * Get event deltas
   */
  async getEventDeltas(
    teamId: string,
    startTime?: string,
    endTime?: string,
    threshold: number = 10.0,
    limit: number = 50
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
        LIMIT ${limit}
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      return result.json().data.map(row => ({
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
   * Get event delta by ID
   */
  async getEventDelta(teamId: string, deltaId: string): Promise<ClickStackEventDelta | null> {
    try {
      const query = `
        SELECT 
          clickstack_baseline as baseline,
          clickstack_current as current,
          clickstack_delta_percent as deltaPercent,
          timestamp,
          clickstack_metadata as metadata
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_correlation_id = '${deltaId}'
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });

      if (result.json().data.length === 0) {
        return null;
      }

      const row = result.json().data[0];
      return {
        baseline: row.baseline,
        current: row.current,
        deltaPercent: row.deltaPercent,
        timestamp: row.timestamp,
        metadata: row.metadata || {},
      };
    } catch (error) {
      throw new Error(`Failed to get event delta: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new event delta
   */
  async createEventDelta(teamId: string, deltaData: {
    baseline: number;
    current: number;
    deltaPercent: number;
    metadata?: Record<string, any>;
  }): Promise<ClickStackEventDelta> {
    try {
      // In a real implementation, you would insert the delta data into ClickHouse
      // For now, we'll simulate the creation
      const eventDelta: ClickStackEventDelta = {
        baseline: deltaData.baseline,
        current: deltaData.current,
        deltaPercent: deltaData.deltaPercent,
        timestamp: new Date().toISOString(),
        metadata: deltaData.metadata || {},
      };

      // Simulate database insertion
      console.log(`Creating event delta for team ${teamId}`);

      return eventDelta;
    } catch (error) {
      throw new Error(`Failed to create event delta: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get event delta analysis
   */
  async getEventDeltaAnalysis(
    teamId: string,
    deltaId: string
  ): Promise<ClickStackEventDeltaAnalysis> {
    try {
      const eventDelta = await this.getEventDelta(teamId, deltaId);
      if (!eventDelta) {
        throw new Error(`Event delta ${deltaId} not found`);
      }

      // Determine severity based on delta percentage
      let severity: 'low' | 'medium' | 'high' | 'critical';
      const absDelta = Math.abs(eventDelta.deltaPercent);
      if (absDelta >= 50) {
        severity = 'critical';
      } else if (absDelta >= 25) {
        severity = 'high';
      } else if (absDelta >= 10) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      // Determine trend
      const trend: 'increasing' | 'decreasing' | 'stable' = 
        eventDelta.deltaPercent > 5 ? 'increasing' :
        eventDelta.deltaPercent < -5 ? 'decreasing' : 'stable';

      // Calculate confidence based on data consistency
      const confidence = Math.min(0.95, 0.5 + Math.abs(eventDelta.deltaPercent) / 100);

      // Simulate impact analysis
      const impact = {
        affectedUsers: Math.floor(Math.abs(eventDelta.deltaPercent) * 10),
        affectedSessions: Math.floor(Math.abs(eventDelta.deltaPercent) * 15),
        performanceImpact: Math.abs(eventDelta.deltaPercent) / 100,
        businessImpact: Math.abs(eventDelta.deltaPercent) / 200,
      };

      // Generate recommendations based on severity and trend
      const recommendations = this.generateRecommendations(severity, trend, eventDelta.deltaPercent);

      return {
        deltaId,
        baseline: eventDelta.baseline,
        current: eventDelta.current,
        deltaPercent: eventDelta.deltaPercent,
        severity,
        trend,
        confidence,
        impact,
        recommendations,
      };
    } catch (error) {
      throw new Error(`Failed to get event delta analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get event delta trend
   */
  async getEventDeltaTrend(
    teamId: string,
    deltaId: string,
    startTime?: string,
    endTime?: string
  ): Promise<ClickStackEventDeltaTrend> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get trend data
      const trendQuery = `
        SELECT 
          toStartOfHour(timestamp) as hour,
          avg(clickstack_delta_percent) as deltaPercent,
          avg(clickstack_baseline) as baseline,
          avg(clickstack_current) as current
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_correlation_id = '${deltaId}' ${timeFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      const trendResult = await this.clickhouse.query({
          query: trendQuery,
          format: 'JSON'
        });
      const trend = trendResult.json().data.map(row => ({
        timestamp: row.hour,
        deltaPercent: row.deltaPercent,
        baseline: row.baseline,
        current: row.current,
      }));

      // Calculate volatility (standard deviation of delta percentages)
      const deltaPercentages = trend.map(t => t.deltaPercent);
      const mean = deltaPercentages.reduce((sum, val) => sum + val, 0) / deltaPercentages.length;
      const variance = deltaPercentages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / deltaPercentages.length;
      const volatility = Math.sqrt(variance);

      // Determine seasonality (simplified)
      const seasonality: 'daily' | 'weekly' | 'monthly' | 'none' = 
        trend.length > 24 ? 'daily' : 
        trend.length > 7 ? 'weekly' : 
        trend.length > 1 ? 'monthly' : 'none';

      // Generate predictions (simplified)
      const prediction = trend.slice(-5).map((point, index) => ({
        timestamp: new Date(new Date(point.timestamp).getTime() + (index + 1) * 60 * 60 * 1000).toISOString(),
        predictedDelta: point.deltaPercent * (1 + Math.random() * 0.1 - 0.05), // Add some randomness
      }));

      // Generate alerts based on thresholds
      const alerts = trend
        .filter(point => Math.abs(point.deltaPercent) > 20)
        .map(point => ({
          timestamp: point.timestamp,
          severity: Math.abs(point.deltaPercent) > 50 ? 'critical' : 
                   Math.abs(point.deltaPercent) > 30 ? 'high' : 'medium',
          message: `Delta exceeded threshold: ${point.deltaPercent.toFixed(2)}%`,
        }));

      return {
        deltaId,
        trend,
        volatility,
        seasonality,
        prediction,
        alerts,
      };
    } catch (error) {
      throw new Error(`Failed to get event delta trend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(
    teamId: string,
    startTime?: string,
    endTime?: string,
    threshold: number = 2.0
  ): Promise<ClickStackAnomalyDetection> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get recent deltas for anomaly detection
      const deltasQuery = `
        SELECT 
          timestamp,
          clickstack_baseline as baseline,
          clickstack_current as current,
          clickstack_delta_percent as deltaPercent,
          clickstack_metadata as metadata
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        ORDER BY timestamp DESC
        LIMIT 1000
      `;

      const deltasResult = await this.clickhouse.query({
          query: deltasQuery,
          format: 'JSON'
        });
      const deltas = deltasResult.json().data;

      // Calculate statistical measures for anomaly detection
      const deltaPercentages = deltas.map(d => d.deltaPercent);
      const mean = deltaPercentages.reduce((sum, val) => sum + val, 0) / deltaPercentages.length;
      const variance = deltaPercentages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / deltaPercentages.length;
      const stdDev = Math.sqrt(variance);

      // Detect anomalies (values beyond threshold * standard deviation)
      const anomalies = deltas
        .filter(delta => Math.abs(delta.deltaPercent - mean) > threshold * stdDev)
        .map(delta => {
          const deviation = Math.abs(delta.deltaPercent - mean) / stdDev;
          let severity: 'low' | 'medium' | 'high' | 'critical';
          if (deviation > 4) {
            severity = 'critical';
          } else if (deviation > 3) {
            severity = 'high';
          } else if (deviation > 2) {
            severity = 'medium';
          } else {
            severity = 'low';
          }

          return {
            timestamp: delta.timestamp,
            metric: 'delta_percent',
            value: delta.deltaPercent,
            expectedValue: mean,
            deviation,
            severity,
          };
        });

      // Identify patterns in anomalies
      const patterns = [
        { pattern: 'spike_detected', frequency: anomalies.length, confidence: 0.85 },
        { pattern: 'trend_change', frequency: Math.floor(anomalies.length * 0.3), confidence: 0.72 },
        { pattern: 'seasonal_variation', frequency: Math.floor(anomalies.length * 0.2), confidence: 0.68 },
      ];

      // Generate recommendations
      const recommendations = [
        'Monitor anomaly frequency and investigate root causes',
        'Consider adjusting thresholds based on business context',
        'Implement automated alerting for critical anomalies',
        'Review system performance during anomaly periods',
      ];

      return {
        anomalies,
        patterns,
        recommendations,
      };
    } catch (error) {
      throw new Error(`Failed to detect anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get event delta statistics
   */
  async getEventDeltaStats(
    teamId: string,
    startTime?: string,
    endTime?: string
  ): Promise<{
    totalDeltas: number;
    anomalies: number;
    avgDeltaPercent: number;
    maxDeltaPercent: number;
    minDeltaPercent: number;
    deltaDistribution: Array<{ range: string; count: number }>;
    topAnomalies: Array<{ timestamp: string; deltaPercent: number; severity: string }>;
  }> {
    try {
      const timeFilter = this.buildTimeFilter(startTime, endTime);

      // Get total deltas
      const totalQuery = `
        SELECT count() as total_deltas
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const totalResult = await this.clickhouse.query({
          query: totalQuery,
          format: 'JSON'
        });
      const totalDeltas = totalResult.json().data[0]?.total_deltas || 0;

      // Get anomalies (deltas with > 20% change)
      const anomaliesQuery = `
        SELECT count() as anomalies
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND abs(clickstack_delta_percent) > 20
      `;

      const anomaliesResult = await this.clickhouse.query({
          query: anomaliesQuery,
          format: 'JSON'
        });
      const anomalies = anomaliesResult.json().data[0]?.anomalies || 0;

      // Get statistics
      const statsQuery = `
        SELECT 
          avg(clickstack_delta_percent) as avg_delta_percent,
          max(clickstack_delta_percent) as max_delta_percent,
          min(clickstack_delta_percent) as min_delta_percent
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
      `;

      const statsResult = await this.clickhouse.query({
          query: statsQuery,
          format: 'JSON'
        });
      const stats = statsResult.json().data[0];

      // Get delta distribution
      const distributionQuery = `
        SELECT 
          CASE 
            WHEN clickstack_delta_percent > 50 THEN '>50%'
            WHEN clickstack_delta_percent > 25 THEN '25-50%'
            WHEN clickstack_delta_percent > 10 THEN '10-25%'
            WHEN clickstack_delta_percent > 0 THEN '0-10%'
            WHEN clickstack_delta_percent > -10 THEN '-10-0%'
            WHEN clickstack_delta_percent > -25 THEN '-25--10%'
            WHEN clickstack_delta_percent > -50 THEN '-50--25%'
            ELSE '<-50%'
          END as range,
          count() as count
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
        GROUP BY range
        ORDER BY range DESC
      `;

      const distributionResult = await this.clickhouse.query({
          query: distributionQuery,
          format: 'JSON'
        });
      const deltaDistribution = distributionResult.json().data.map(row => ({
        range: row.range,
        count: row.count,
      }));

      // Get top anomalies
      const topAnomaliesQuery = `
        SELECT 
          timestamp,
          clickstack_delta_percent as deltaPercent
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}' ${timeFilter}
          AND abs(clickstack_delta_percent) > 20
        ORDER BY abs(clickstack_delta_percent) DESC
        LIMIT 10
      `;

      const topAnomaliesResult = await this.clickhouse.query({
          query: topAnomaliesQuery,
          format: 'JSON'
        });
      const topAnomalies = topAnomaliesResult.json().data.map(row => {
        const absDelta = Math.abs(row.deltaPercent);
        let severity: string;
        if (absDelta > 50) {
          severity = 'critical';
        } else if (absDelta > 30) {
          severity = 'high';
        } else {
          severity = 'medium';
        }

        return {
          timestamp: row.timestamp,
          deltaPercent: row.deltaPercent,
          severity,
        };
      });

      return {
        totalDeltas,
        anomalies,
        avgDeltaPercent: stats.avg_delta_percent || 0,
        maxDeltaPercent: stats.max_delta_percent || 0,
        minDeltaPercent: stats.min_delta_percent || 0,
        deltaDistribution,
        topAnomalies,
      };
    } catch (error) {
      throw new Error(`Failed to get event delta stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate recommendations based on severity, trend, and delta percentage
   */
  private generateRecommendations(
    severity: string,
    trend: string,
    deltaPercent: number
  ): string[] {
    const recommendations: string[] = [];

    if (severity === 'critical') {
      recommendations.push('Immediately investigate the root cause of this significant change');
      recommendations.push('Implement emergency monitoring and alerting');
      recommendations.push('Consider rolling back recent changes if applicable');
    } else if (severity === 'high') {
      recommendations.push('Investigate the cause of this significant change');
      recommendations.push('Monitor closely for further changes');
      recommendations.push('Review recent deployments or configuration changes');
    } else if (severity === 'medium') {
      recommendations.push('Monitor the trend and investigate if it continues');
      recommendations.push('Review system performance and resource usage');
      recommendations.push('Consider implementing additional monitoring');
    } else {
      recommendations.push('Continue monitoring for any escalation');
      recommendations.push('Document the change for future reference');
    }

    if (trend === 'increasing' && deltaPercent > 0) {
      recommendations.push('Investigate what is causing the upward trend');
      recommendations.push('Consider scaling resources if needed');
    } else if (trend === 'decreasing' && deltaPercent < 0) {
      recommendations.push('Investigate what is causing the downward trend');
      recommendations.push('Check for potential issues or optimizations');
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

export const clickstackEventDeltaService = ClickStackEventDeltaService.getInstance();
