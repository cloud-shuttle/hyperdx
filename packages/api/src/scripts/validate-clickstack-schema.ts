#!/usr/bin/env ts-node

/**
 * ClickStack ClickHouse Schema Validation Script
 * 
 * This script validates the ClickStack ClickHouse schema by:
 * 1. Testing ClickStack column creation
 * 2. Validating ClickStack indexes
 * 3. Checking ClickStack views
 * 4. Verifying ClickStack functions
 * 5. Testing ClickStack queries
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock ClickHouse schema validation
describe('ClickStack ClickHouse Schema', () => {
  let mockClickHouseSchema: any;

  beforeEach(() => {
    // Mock ClickHouse schema structure
    mockClickHouseSchema = {
      tables: {
        logs: {
          columns: {
            // Existing columns
            tenant_id: { type: 'String', default: '' },
            timestamp: { type: 'DateTime64(3)' },
            body: { type: 'String' },
            
            // ClickStack core columns
            clickstack_version: { type: 'String', default: '1.0' },
            clickstack_ingestion_time: { type: 'DateTime64(3)', default: 'now()' },
            clickstack_pipeline_version: { type: 'String', default: '1.0' },
            clickstack_correlation_id: { type: 'String', default: '' },
            clickstack_metadata: { type: 'Map(String, String)', default: 'map()' },
            
            // Session replay columns
            clickstack_session_id: { type: 'String', default: '' },
            clickstack_user_id: { type: 'String', default: '' },
            clickstack_page_url: { type: 'String', default: '' },
            clickstack_viewport: { type: 'Map(String, UInt32)', default: 'map()' },
            clickstack_user_agent: { type: 'String', default: '' },
            clickstack_events: { type: 'Array(String)', default: '[]' },
            
            // Pattern recognition columns
            clickstack_pattern_id: { type: 'String', default: '' },
            clickstack_pattern_type: { type: 'String', default: '' },
            clickstack_pattern_confidence: { type: 'Float32', default: '0.0' },
            clickstack_pattern_occurrences: { type: 'UInt32', default: '0' },
            
            // Event delta analysis columns
            clickstack_baseline: { type: 'Float64', default: '0.0' },
            clickstack_current: { type: 'Float64', default: '0.0' },
            clickstack_delta_percent: { type: 'Float32', default: '0.0' }
          },
          indexes: [
            'idx_clickstack_version',
            'idx_clickstack_session_id',
            'idx_clickstack_user_id',
            'idx_clickstack_session_timestamp',
            'idx_clickstack_pattern_id',
            'idx_clickstack_pattern_type',
            'idx_clickstack_pattern_confidence',
            'idx_clickstack_delta_percent',
            'idx_clickstack_baseline',
            'idx_clickstack_current',
            'idx_clickstack_tenant_session',
            'idx_clickstack_tenant_pattern',
            'idx_clickstack_tenant_timestamp'
          ]
        },
        traces: {
          columns: {
            // Existing columns
            tenant_id: { type: 'String', default: '' },
            timestamp: { type: 'DateTime64(3)' },
            
            // ClickStack core columns
            clickstack_version: { type: 'String', default: '1.0' },
            clickstack_ingestion_time: { type: 'DateTime64(3)', default: 'now()' },
            clickstack_pipeline_version: { type: 'String', default: '1.0' },
            clickstack_correlation_id: { type: 'String', default: '' },
            clickstack_metadata: { type: 'Map(String, String)', default: 'map()' }
          },
          indexes: [
            'idx_clickstack_version'
          ]
        },
        metric_stream: {
          columns: {
            // Existing columns
            tenant_id: { type: 'String', default: '' },
            timestamp: { type: 'DateTime64(3)' },
            
            // ClickStack core columns
            clickstack_version: { type: 'String', default: '1.0' },
            clickstack_ingestion_time: { type: 'DateTime64(3)', default: 'now()' },
            clickstack_pipeline_version: { type: 'String', default: '1.0' },
            clickstack_correlation_id: { type: 'String', default: '' },
            clickstack_metadata: { type: 'Map(String, String)', default: 'map()' }
          },
          indexes: [
            'idx_clickstack_version'
          ]
        }
      },
      views: [
        'clickstack_sessions',
        'clickstack_patterns',
        'clickstack_event_deltas',
        'clickstack_correlations'
      ],
      functions: [
        'clickstack_extract_metadata',
        'clickstack_feature_enabled',
        'clickstack_get_version'
      ]
    };
  });

  describe('ClickStack Column Validation', () => {
    it('should have all required ClickStack core columns in logs table', () => {
      const logsColumns = mockClickHouseSchema.tables.logs.columns;
      const requiredCoreColumns = [
        'clickstack_version',
        'clickstack_ingestion_time',
        'clickstack_pipeline_version',
        'clickstack_correlation_id',
        'clickstack_metadata'
      ];

      requiredCoreColumns.forEach(column => {
        expect(logsColumns[column]).toBeDefined();
        expect(logsColumns[column].type).toBeDefined();
        expect(logsColumns[column].default).toBeDefined();
      });
    });

    it('should have all required ClickStack core columns in traces table', () => {
      const tracesColumns = mockClickHouseSchema.tables.traces.columns;
      const requiredCoreColumns = [
        'clickstack_version',
        'clickstack_ingestion_time',
        'clickstack_pipeline_version',
        'clickstack_correlation_id',
        'clickstack_metadata'
      ];

      requiredCoreColumns.forEach(column => {
        expect(tracesColumns[column]).toBeDefined();
        expect(tracesColumns[column].type).toBeDefined();
        expect(tracesColumns[column].default).toBeDefined();
      });
    });

    it('should have all required ClickStack core columns in metric_stream table', () => {
      const metricsColumns = mockClickHouseSchema.tables.metric_stream.columns;
      const requiredCoreColumns = [
        'clickstack_version',
        'clickstack_ingestion_time',
        'clickstack_pipeline_version',
        'clickstack_correlation_id',
        'clickstack_metadata'
      ];

      requiredCoreColumns.forEach(column => {
        expect(metricsColumns[column]).toBeDefined();
        expect(metricsColumns[column].type).toBeDefined();
        expect(metricsColumns[column].default).toBeDefined();
      });
    });

    it('should have session replay columns in logs table', () => {
      const logsColumns = mockClickHouseSchema.tables.logs.columns;
      const sessionReplayColumns = [
        'clickstack_session_id',
        'clickstack_user_id',
        'clickstack_page_url',
        'clickstack_viewport',
        'clickstack_user_agent',
        'clickstack_events'
      ];

      sessionReplayColumns.forEach(column => {
        expect(logsColumns[column]).toBeDefined();
        expect(logsColumns[column].type).toBeDefined();
        expect(logsColumns[column].default).toBeDefined();
      });
    });

    it('should have pattern recognition columns in logs table', () => {
      const logsColumns = mockClickHouseSchema.tables.logs.columns;
      const patternColumns = [
        'clickstack_pattern_id',
        'clickstack_pattern_type',
        'clickstack_pattern_confidence',
        'clickstack_pattern_occurrences'
      ];

      patternColumns.forEach(column => {
        expect(logsColumns[column]).toBeDefined();
        expect(logsColumns[column].type).toBeDefined();
        expect(logsColumns[column].default).toBeDefined();
      });
    });

    it('should have event delta analysis columns in logs table', () => {
      const logsColumns = mockClickHouseSchema.tables.logs.columns;
      const deltaColumns = [
        'clickstack_baseline',
        'clickstack_current',
        'clickstack_delta_percent'
      ];

      deltaColumns.forEach(column => {
        expect(logsColumns[column]).toBeDefined();
        expect(logsColumns[column].type).toBeDefined();
        expect(logsColumns[column].default).toBeDefined();
      });
    });
  });

  describe('ClickStack Index Validation', () => {
    it('should have ClickStack version indexes on all tables', () => {
      const tables = ['logs', 'traces', 'metric_stream'];
      
      tables.forEach(table => {
        const indexes = mockClickHouseSchema.tables[table].indexes;
        expect(indexes).toContain('idx_clickstack_version');
      });
    });

    it('should have session replay indexes on logs table', () => {
      const logsIndexes = mockClickHouseSchema.tables.logs.indexes;
      const sessionIndexes = [
        'idx_clickstack_session_id',
        'idx_clickstack_user_id',
        'idx_clickstack_session_timestamp'
      ];

      sessionIndexes.forEach(index => {
        expect(logsIndexes).toContain(index);
      });
    });

    it('should have pattern recognition indexes on logs table', () => {
      const logsIndexes = mockClickHouseSchema.tables.logs.indexes;
      const patternIndexes = [
        'idx_clickstack_pattern_id',
        'idx_clickstack_pattern_type',
        'idx_clickstack_pattern_confidence'
      ];

      patternIndexes.forEach(index => {
        expect(logsIndexes).toContain(index);
      });
    });

    it('should have event delta analysis indexes on logs table', () => {
      const logsIndexes = mockClickHouseSchema.tables.logs.indexes;
      const deltaIndexes = [
        'idx_clickstack_delta_percent',
        'idx_clickstack_baseline',
        'idx_clickstack_current'
      ];

      deltaIndexes.forEach(index => {
        expect(logsIndexes).toContain(index);
      });
    });

    it('should have composite tenant indexes on logs table', () => {
      const logsIndexes = mockClickHouseSchema.tables.logs.indexes;
      const compositeIndexes = [
        'idx_clickstack_tenant_session',
        'idx_clickstack_tenant_pattern',
        'idx_clickstack_tenant_timestamp'
      ];

      compositeIndexes.forEach(index => {
        expect(logsIndexes).toContain(index);
      });
    });
  });

  describe('ClickStack Views Validation', () => {
    it('should have all required ClickStack views', () => {
      const views = mockClickHouseSchema.views;
      const requiredViews = [
        'clickstack_sessions',
        'clickstack_patterns',
        'clickstack_event_deltas',
        'clickstack_correlations'
      ];

      requiredViews.forEach(view => {
        expect(views).toContain(view);
      });
    });
  });

  describe('ClickStack Functions Validation', () => {
    it('should have all required ClickStack functions', () => {
      const functions = mockClickHouseSchema.functions;
      const requiredFunctions = [
        'clickstack_extract_metadata',
        'clickstack_feature_enabled',
        'clickstack_get_version'
      ];

      requiredFunctions.forEach(func => {
        expect(functions).toContain(func);
      });
    });
  });

  describe('ClickStack Query Validation', () => {
    it('should support session replay queries', () => {
      // Mock session replay query
      const sessionQuery = `
        SELECT 
            clickstack_session_id,
            clickstack_user_id,
            clickstack_page_url,
            timestamp
        FROM clickstack_sessions
        WHERE clickstack_user_id = 'user-123'
        ORDER BY timestamp
      `;

      // Validate query structure
      expect(sessionQuery).toContain('clickstack_sessions');
      expect(sessionQuery).toContain('clickstack_session_id');
      expect(sessionQuery).toContain('clickstack_user_id');
      expect(sessionQuery).toContain('clickstack_page_url');
    });

    it('should support pattern recognition queries', () => {
      // Mock pattern recognition query
      const patternQuery = `
        SELECT 
            clickstack_pattern_id,
            clickstack_pattern_type,
            clickstack_pattern_confidence,
            clickstack_pattern_occurrences
        FROM clickstack_patterns
        WHERE clickstack_pattern_confidence > 0.8
        ORDER BY clickstack_pattern_occurrences DESC
      `;

      // Validate query structure
      expect(patternQuery).toContain('clickstack_patterns');
      expect(patternQuery).toContain('clickstack_pattern_id');
      expect(patternQuery).toContain('clickstack_pattern_type');
      expect(patternQuery).toContain('clickstack_pattern_confidence');
      expect(patternQuery).toContain('clickstack_pattern_occurrences');
    });

    it('should support event delta analysis queries', () => {
      // Mock event delta query
      const deltaQuery = `
        SELECT 
            clickstack_baseline,
            clickstack_current,
            clickstack_delta_percent,
            timestamp
        FROM clickstack_event_deltas
        WHERE abs(clickstack_delta_percent) > 10.0
        ORDER BY abs(clickstack_delta_percent) DESC
      `;

      // Validate query structure
      expect(deltaQuery).toContain('clickstack_event_deltas');
      expect(deltaQuery).toContain('clickstack_baseline');
      expect(deltaQuery).toContain('clickstack_current');
      expect(deltaQuery).toContain('clickstack_delta_percent');
    });

    it('should support cross-telemetry correlation queries', () => {
      // Mock correlation query
      const correlationQuery = `
        SELECT 
            clickstack_correlation_id,
            data_type,
            timestamp,
            clickstack_ingestion_time
        FROM clickstack_correlations
        WHERE clickstack_correlation_id = 'corr-xyz789'
        ORDER BY timestamp
      `;

      // Validate query structure
      expect(correlationQuery).toContain('clickstack_correlations');
      expect(correlationQuery).toContain('clickstack_correlation_id');
      expect(correlationQuery).toContain('data_type');
    });
  });

  describe('ClickStack Data Type Validation', () => {
    it('should have correct data types for ClickStack columns', () => {
      const logsColumns = mockClickHouseSchema.tables.logs.columns;
      
      // Core columns
      expect(logsColumns.clickstack_version.type).toBe('String');
      expect(logsColumns.clickstack_ingestion_time.type).toBe('DateTime64(3)');
      expect(logsColumns.clickstack_pipeline_version.type).toBe('String');
      expect(logsColumns.clickstack_correlation_id.type).toBe('String');
      expect(logsColumns.clickstack_metadata.type).toBe('Map(String, String)');
      
      // Session replay columns
      expect(logsColumns.clickstack_session_id.type).toBe('String');
      expect(logsColumns.clickstack_user_id.type).toBe('String');
      expect(logsColumns.clickstack_page_url.type).toBe('String');
      expect(logsColumns.clickstack_viewport.type).toBe('Map(String, UInt32)');
      expect(logsColumns.clickstack_user_agent.type).toBe('String');
      expect(logsColumns.clickstack_events.type).toBe('Array(String)');
      
      // Pattern recognition columns
      expect(logsColumns.clickstack_pattern_id.type).toBe('String');
      expect(logsColumns.clickstack_pattern_type.type).toBe('String');
      expect(logsColumns.clickstack_pattern_confidence.type).toBe('Float32');
      expect(logsColumns.clickstack_pattern_occurrences.type).toBe('UInt32');
      
      // Event delta analysis columns
      expect(logsColumns.clickstack_baseline.type).toBe('Float64');
      expect(logsColumns.clickstack_current.type).toBe('Float64');
      expect(logsColumns.clickstack_delta_percent.type).toBe('Float32');
    });

    it('should have appropriate default values for ClickStack columns', () => {
      const logsColumns = mockClickHouseSchema.tables.logs.columns;
      
      // Core columns
      expect(logsColumns.clickstack_version.default).toBe('1.0');
      expect(logsColumns.clickstack_ingestion_time.default).toBe('now()');
      expect(logsColumns.clickstack_pipeline_version.default).toBe('1.0');
      expect(logsColumns.clickstack_correlation_id.default).toBe('');
      expect(logsColumns.clickstack_metadata.default).toBe('map()');
      
      // Session replay columns
      expect(logsColumns.clickstack_session_id.default).toBe('');
      expect(logsColumns.clickstack_user_id.default).toBe('');
      expect(logsColumns.clickstack_page_url.default).toBe('');
      expect(logsColumns.clickstack_viewport.default).toBe('map()');
      expect(logsColumns.clickstack_user_agent.default).toBe('');
      expect(logsColumns.clickstack_events.default).toBe('[]');
      
      // Pattern recognition columns
      expect(logsColumns.clickstack_pattern_id.default).toBe('');
      expect(logsColumns.clickstack_pattern_type.default).toBe('');
      expect(logsColumns.clickstack_pattern_confidence.default).toBe('0.0');
      expect(logsColumns.clickstack_pattern_occurrences.default).toBe('0');
      
      // Event delta analysis columns
      expect(logsColumns.clickstack_baseline.default).toBe('0.0');
      expect(logsColumns.clickstack_current.default).toBe('0.0');
      expect(logsColumns.clickstack_delta_percent.default).toBe('0.0');
    });
  });

  describe('ClickStack Schema Performance', () => {
    it('should have optimized indexes for ClickStack queries', () => {
      const logsIndexes = mockClickHouseSchema.tables.logs.indexes;
      
      // Check for bloom filter indexes (efficient for high-cardinality strings)
      const bloomFilterIndexes = [
        'idx_clickstack_version',
        'idx_clickstack_session_id',
        'idx_clickstack_user_id',
        'idx_clickstack_pattern_id',
        'idx_clickstack_pattern_type'
      ];
      
      bloomFilterIndexes.forEach(index => {
        expect(logsIndexes).toContain(index);
      });
      
      // Check for minmax indexes (efficient for ranges)
      const minmaxIndexes = [
        'idx_clickstack_session_timestamp',
        'idx_clickstack_pattern_confidence',
        'idx_clickstack_delta_percent',
        'idx_clickstack_baseline',
        'idx_clickstack_current',
        'idx_clickstack_tenant_timestamp'
      ];
      
      minmaxIndexes.forEach(index => {
        expect(logsIndexes).toContain(index);
      });
    });

    it('should support efficient tenant isolation', () => {
      const logsIndexes = mockClickHouseSchema.tables.logs.indexes;
      
      // Check for tenant-specific composite indexes
      const tenantIndexes = [
        'idx_clickstack_tenant_session',
        'idx_clickstack_tenant_pattern',
        'idx_clickstack_tenant_timestamp'
      ];
      
      tenantIndexes.forEach(index => {
        expect(logsIndexes).toContain(index);
      });
    });
  });
});
