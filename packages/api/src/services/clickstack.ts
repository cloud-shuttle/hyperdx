import { client } from '@/clickhouse';
import Team from '@/models/team';

export interface ClickStackHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  features: {
    sessionReplay: boolean;
    patternRecognition: boolean;
    eventDeltaAnalysis: boolean;
  };
  metrics: {
    totalSessions: number;
    totalPatterns: number;
    totalEventDeltas: number;
    lastIngestionTime: string;
  };
  errors: string[];
}

export interface ClickStackFeatures {
  sessionReplay: {
    enabled: boolean;
    version: string;
    settings: Record<string, any>;
  };
  patternRecognition: {
    enabled: boolean;
    version: string;
    settings: Record<string, any>;
  };
  eventDeltaAnalysis: {
    enabled: boolean;
    version: string;
    settings: Record<string, any>;
  };
}

export interface ClickStackCorrelatedData {
  correlationId: string;
  logs: any[];
  traces: any[];
  metrics: any[];
  sessions: any[];
  patterns: any[];
  eventDeltas: any[];
  timestamp: string;
}

export interface ClickStackMetadata {
  key: string;
  value: any;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export class ClickStackService {
  private static instance: ClickStackService;
  private clickhouse = client;

  private constructor() {
    // Use the singleton client instance
  }

  public static getInstance(): ClickStackService {
    if (!ClickStackService.instance) {
      ClickStackService.instance = new ClickStackService();
    }
    return ClickStackService.instance;
  }

  /**
   * Get ClickStack health status for a team
   */
  async getHealth(teamId: string): Promise<ClickStackHealth> {
    try {
      // Get ClickStack version and basic metrics
      const versionQuery = `
        SELECT 
          clickstack_version,
          count() as total_records,
          max(clickstack_ingestion_time) as last_ingestion
        FROM default.logs 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_version != ''
        LIMIT 1
      `;

      const versionResult = await this.clickhouse.query({
          query: versionQuery,
          format: 'JSON'
        });
      const versionData = await versionResult.json() as any;
      const version = versionData.data[0]?.clickstack_version || '1.0';

      // Get session replay metrics
      const sessionsQuery = `
        SELECT count() as total_sessions
        FROM clickstack_sessions 
        WHERE tenant_id = '${teamId}'
      `;

      const sessionsResult = await this.clickhouse.query({
          query: sessionsQuery,
          format: 'JSON'
        });
      const sessionsData = await sessionsResult.json() as any;
      const totalSessions = sessionsData.data[0]?.total_sessions || 0;

      // Get pattern recognition metrics
      const patternsQuery = `
        SELECT count() as total_patterns
        FROM clickstack_patterns 
        WHERE tenant_id = '${teamId}'
      `;

      const patternsResult = await this.clickhouse.query({
          query: patternsQuery,
          format: 'JSON'
        });
      const patternsData = await patternsResult.json() as any;
      const totalPatterns = patternsData.data[0]?.total_patterns || 0;

      // Get event delta analysis metrics
      const deltasQuery = `
        SELECT count() as total_deltas
        FROM clickstack_event_deltas 
        WHERE tenant_id = '${teamId}'
      `;

      const deltasResult = await this.clickhouse.query({
          query: deltasQuery,
          format: 'JSON'
        });
      const deltasData = await deltasResult.json() as any;
      const totalEventDeltas = deltasData.data[0]?.total_deltas || 0;

      // Determine health status
      const lastIngestion = versionData.data[0]?.last_ingestion;
      const isHealthy = lastIngestion && 
        new Date(lastIngestion).getTime() > Date.now() - 24 * 60 * 60 * 1000; // Within 24 hours

      const status: 'healthy' | 'degraded' | 'unhealthy' = isHealthy ? 'healthy' : 'degraded';

      return {
        status,
        version,
        features: {
          sessionReplay: totalSessions > 0,
          patternRecognition: totalPatterns > 0,
          eventDeltaAnalysis: totalEventDeltas > 0,
        },
        metrics: {
          totalSessions,
          totalPatterns,
          totalEventDeltas,
          lastIngestionTime: lastIngestion || 'Never',
        },
        errors: [],
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        version: '1.0',
        features: {
          sessionReplay: false,
          patternRecognition: false,
          eventDeltaAnalysis: false,
        },
        metrics: {
          totalSessions: 0,
          totalPatterns: 0,
          totalEventDeltas: 0,
          lastIngestionTime: 'Never',
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get ClickStack features status for a team
   */
  async getFeatures(teamId: string): Promise<ClickStackFeatures> {
    try {
      // Get team settings to determine feature status
      const team = await Team.findOne({ _id: teamId });
      const clickstackSettings = team?.clickstackSettings || {};

      return {
        sessionReplay: {
          enabled: clickstackSettings.sessionReplay?.enabled || false,
          version: clickstackSettings.sessionReplay?.version || '1.0',
          settings: clickstackSettings.sessionReplay?.settings || {},
        },
        patternRecognition: {
          enabled: clickstackSettings.patternRecognition?.enabled || false,
          version: clickstackSettings.patternRecognition?.version || '1.0',
          settings: clickstackSettings.patternRecognition?.settings || {},
        },
        eventDeltaAnalysis: {
          enabled: clickstackSettings.eventDeltaAnalysis?.enabled || false,
          version: clickstackSettings.eventDeltaAnalysis?.version || '1.0',
          settings: clickstackSettings.eventDeltaAnalysis?.settings || {},
        },
      };
    } catch (error) {
      // Return default features if team not found
      return {
        sessionReplay: {
          enabled: false,
          version: '1.0',
          settings: {},
        },
        patternRecognition: {
          enabled: false,
          version: '1.0',
          settings: {},
        },
        eventDeltaAnalysis: {
          enabled: false,
          version: '1.0',
          settings: {},
        },
      };
    }
  }

  /**
   * Get correlated data across all telemetry types
   */
  async getCorrelatedData(
    teamId: string,
    correlationId: string,
    dataTypes?: string[]
  ): Promise<ClickStackCorrelatedData> {
    try {
      const results: ClickStackCorrelatedData = {
        correlationId,
        logs: [],
        traces: [],
        metrics: [],
        sessions: [],
        patterns: [],
        eventDeltas: [],
        timestamp: new Date().toISOString(),
      };

      // Get logs with correlation ID
      if (!dataTypes || dataTypes.includes('logs')) {
        const logsQuery = `
          SELECT 
            timestamp,
            body,
            clickstack_metadata,
            clickstack_session_id,
            clickstack_pattern_id
          FROM default.logs 
          WHERE tenant_id = '${teamId}' 
            AND clickstack_correlation_id = '${correlationId}'
          ORDER BY timestamp DESC
          LIMIT 100
        `;

        const logsResult = await this.clickhouse.query({
          query: logsQuery,
          format: 'JSON'
        });
        const logsData = await logsResult.json() as any;
        results.logs = logsData.data;
      }

      // Get traces with correlation ID
      if (!dataTypes || dataTypes.includes('traces')) {
        const tracesQuery = `
          SELECT 
            timestamp,
            span_name,
            span_id,
            trace_id,
            clickstack_metadata
          FROM default.traces 
          WHERE tenant_id = '${teamId}' 
            AND clickstack_correlation_id = '${correlationId}'
          ORDER BY timestamp DESC
          LIMIT 100
        `;

        const tracesResult = await this.clickhouse.query({
          query: tracesQuery,
          format: 'JSON'
        });
        const tracesData = await tracesResult.json() as any;
        results.traces = tracesData.data;
      }

      // Get metrics with correlation ID
      if (!dataTypes || dataTypes.includes('metrics')) {
        const metricsQuery = `
          SELECT 
            timestamp,
            metric_name,
            metric_value,
            clickstack_metadata
          FROM default.metric_stream 
          WHERE tenant_id = '${teamId}' 
            AND clickstack_correlation_id = '${correlationId}'
          ORDER BY timestamp DESC
          LIMIT 100
        `;

        const metricsResult = await this.clickhouse.query({
          query: metricsQuery,
          format: 'JSON'
        });
        const metricsData = await metricsResult.json() as any;
        results.metrics = metricsData.data;
      }

      // Get session data if correlation ID matches session ID
      if (!dataTypes || dataTypes.includes('sessions')) {
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
          WHERE tenant_id = '${teamId}' 
            AND clickstack_session_id = '${correlationId}'
          LIMIT 1
        `;

        const sessionsResult = await this.clickhouse.query({
          query: sessionsQuery,
          format: 'JSON'
        });
        const sessionsData = await sessionsResult.json() as any;
        results.sessions = sessionsData.data;
      }

      // Get pattern data if correlation ID matches pattern ID
      if (!dataTypes || dataTypes.includes('patterns')) {
        const patternsQuery = `
          SELECT 
            clickstack_pattern_id,
            clickstack_pattern_type,
            clickstack_pattern_confidence,
            clickstack_pattern_occurrences,
            timestamp
          FROM clickstack_patterns 
          WHERE tenant_id = '${teamId}' 
            AND clickstack_pattern_id = '${correlationId}'
          LIMIT 1
        `;

        const patternsResult = await this.clickhouse.query({
          query: patternsQuery,
          format: 'JSON'
        });
        const patternsData = await patternsResult.json() as any;
        results.patterns = patternsData.data;
      }

      // Get event delta data if correlation ID matches delta ID
      if (!dataTypes || dataTypes.includes('eventDeltas')) {
        const deltasQuery = `
          SELECT 
            clickstack_baseline,
            clickstack_current,
            clickstack_delta_percent,
            timestamp
          FROM clickstack_event_deltas 
          WHERE tenant_id = '${teamId}' 
            AND clickstack_correlation_id = '${correlationId}'
          LIMIT 1
        `;

        const deltasResult = await this.clickhouse.query({
          query: deltasQuery,
          format: 'JSON'
        });
        const deltasData = await deltasResult.json() as any;
        results.eventDeltas = deltasData.data;
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to get correlated data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ClickStack metadata for a team
   */
  async getMetadata(teamId: string, key?: string): Promise<ClickStackMetadata | ClickStackMetadata[]> {
    try {
      if (key) {
        // Get specific metadata key
        const query = `
          SELECT 
            '${key}' as key,
            clickstack_metadata['${key}'] as value,
            '${teamId}' as teamId,
            min(timestamp) as createdAt,
            max(timestamp) as updatedAt
          FROM default.logs 
          WHERE tenant_id = '${teamId}' 
            AND clickstack_metadata['${key}'] != ''
          LIMIT 1
        `;

        const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });
        
        const data = await result.json() as any;
        if (data.length === 0) {
          throw new Error(`Metadata key '${key}' not found`);
        }

        return {
          key,
          value: data[0].value,
          teamId,
          createdAt: data[0].createdAt,
          updatedAt: data[0].updatedAt,
        };
      } else {
        // Get all metadata keys
        const query = `
          SELECT 
            arrayJoin(mapKeys(clickstack_metadata)) as key,
            arrayJoin(mapValues(clickstack_metadata)) as value,
            '${teamId}' as teamId,
            min(timestamp) as createdAt,
            max(timestamp) as updatedAt
          FROM default.logs 
          WHERE tenant_id = '${teamId}' 
            AND clickstack_metadata != map()
          GROUP BY key, value
          ORDER BY key
        `;

        const result = await this.clickhouse.query({
          query: query,
          format: 'JSON'
        });
        
        const data = await result.json() as any;
        return data.map(row => ({
          key: row.key,
          value: row.value,
          teamId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      }
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update ClickStack metadata for a team
   */
  async updateMetadata(teamId: string, key: string, value: any): Promise<ClickStackMetadata> {
    try {
      // Update team settings with metadata
      const team = await Team.findOne({ _id: teamId });
      if (!team) {
        throw new Error(`Team '${teamId}' not found`);
      }

      // Initialize clickstackSettings if it doesn't exist
      if (!team.clickstackSettings) {
        team.clickstackSettings = {};
      }

      if (!team.clickstackSettings.metadata) {
        team.clickstackSettings.metadata = {};
      }

      // Update metadata
      team.clickstackSettings.metadata[key] = value;
      team.clickstackSettings.metadata.updatedAt = new Date().toISOString();

      await team.save();

      return {
        key,
        value,
        teamId,
        createdAt: team.clickstackSettings.metadata.createdAt || new Date().toISOString(),
        updatedAt: team.clickstackSettings.metadata.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to update metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate ClickStack configuration for a team
   */
  async validateConfiguration(teamId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if ClickStack data exists
      const dataQuery = `
        SELECT count() as count
        FROM default.logs 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_version != ''
        LIMIT 1
      `;

      const dataResult = await this.clickhouse.query({
          query: dataQuery,
          format: 'JSON'
        });
      const dataData = await dataResult.json() as any;
      const hasData = dataData.data[0]?.count > 0;

      if (!hasData) {
        warnings.push('No ClickStack data found for this team');
      }

      // Check ClickStack version consistency
      const versionQuery = `
        SELECT 
          clickstack_version,
          count() as count
        FROM default.logs 
        WHERE tenant_id = '${teamId}' 
          AND clickstack_version != ''
        GROUP BY clickstack_version
        ORDER BY count DESC
      `;

      const versionResult = await this.clickhouse.query({
          query: versionQuery,
          format: 'JSON'
        });
      
      const versionData = await versionResult.json() as any;
      if (versionData.data.length > 1) {
        warnings.push('Multiple ClickStack versions detected');
      }

      // Check for required ClickStack columns
      const columnsQuery = `
        SELECT name
        FROM system.columns
        WHERE table = 'logs' 
          AND database = 'default'
          AND name LIKE 'clickstack_%'
        ORDER BY name
      `;

      const columnsResult = await this.clickhouse.query({
          query: columnsQuery,
          format: 'JSON'
        });
      const requiredColumns = [
        'clickstack_version',
        'clickstack_ingestion_time',
        'clickstack_pipeline_version',
        'clickstack_correlation_id',
        'clickstack_metadata'
      ];

      const columnsData = await columnsResult.json() as any;
      const existingColumns = columnsData.data.map(row => row.name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        errors.push(`Missing required ClickStack columns: ${missingColumns.join(', ')}`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        errors,
        warnings,
      };
    }
  }
}

export const clickstackService = ClickStackService.getInstance();
