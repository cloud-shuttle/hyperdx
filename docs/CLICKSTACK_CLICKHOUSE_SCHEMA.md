# ClickStack ClickHouse Schema Documentation

## Overview

This document describes the ClickStack-specific extensions to the ClickHouse schema in our multi-tenant HyperDX architecture. These extensions enable advanced ClickStack features including session replay, pattern recognition, and event delta analysis while maintaining full tenant isolation.

## Schema Extensions

### 1. ClickStack Core Columns

All observability tables (logs, traces, metrics) include these core ClickStack columns:

#### `clickstack_version`
- **Type**: `String`
- **Default**: `'1.0'`
- **Purpose**: Identifies the ClickStack version for data compatibility
- **Usage**: Filtering and version-specific processing

#### `clickstack_ingestion_time`
- **Type**: `DateTime64(3)`
- **Default**: `now()`
- **Purpose**: Timestamp when data was ingested by ClickStack pipeline
- **Usage**: Performance monitoring and data freshness analysis

#### `clickstack_pipeline_version`
- **Type**: `String`
- **Default**: `'1.0'`
- **Purpose**: Identifies the ClickStack pipeline version
- **Usage**: Pipeline compatibility and debugging

#### `clickstack_correlation_id`
- **Type**: `String`
- **Default**: `''`
- **Purpose**: Correlation ID for linking related telemetry across types
- **Usage**: Distributed tracing and correlation analysis

#### `clickstack_metadata`
- **Type**: `Map(String, String)`
- **Default**: `map()`
- **Purpose**: Flexible metadata storage for ClickStack-specific data
- **Usage**: Feature flags, configuration, and extensible attributes

### 2. Session Replay Columns (Logs Table Only)

#### `clickstack_session_id`
- **Type**: `String`
- **Default**: `''`
- **Purpose**: Unique identifier for user session
- **Usage**: Session replay and user journey analysis

#### `clickstack_user_id`
- **Type**: `String`
- **Default**: `''`
- **Purpose**: User identifier for session replay
- **Usage**: User-specific session analysis

#### `clickstack_page_url`
- **Type**: `String`
- **Default**: `''`
- **Purpose**: Page URL where session event occurred
- **Usage**: Page-specific session analysis

#### `clickstack_viewport`
- **Type**: `Map(String, UInt32)`
- **Default**: `map()`
- **Purpose**: Viewport dimensions (width, height)
- **Usage**: Responsive design analysis

#### `clickstack_user_agent`
- **Type**: `String`
- **Default**: `''`
- **Purpose**: User agent string
- **Usage**: Browser and device analysis

#### `clickstack_events`
- **Type**: `Array(String)`
- **Default**: `[]`
- **Purpose**: Array of session events
- **Usage**: Event sequence analysis

### 3. Pattern Recognition Columns (Logs Table Only)

#### `clickstack_pattern_id`
- **Type**: `String`
- **Default**: `''`
- **Purpose**: Unique pattern identifier
- **Usage**: Pattern tracking and analysis

#### `clickstack_pattern_type`
- **Type**: `String`
- **Default**: `''`
- **Purpose**: Type of pattern (e.g., 'error_sequence', 'performance_anomaly')
- **Usage**: Pattern categorization

#### `clickstack_pattern_confidence`
- **Type**: `Float32`
- **Default**: `0.0`
- **Purpose**: Confidence score for pattern detection (0.0 to 1.0)
- **Usage**: Pattern reliability assessment

#### `clickstack_pattern_occurrences`
- **Type**: `UInt32`
- **Default**: `0`
- **Purpose**: Number of times pattern has occurred
- **Usage**: Pattern frequency analysis

### 4. Event Delta Analysis Columns (Logs Table Only)

#### `clickstack_baseline`
- **Type**: `Float64`
- **Default**: `0.0`
- **Purpose**: Baseline value for comparison
- **Usage**: Anomaly detection baseline

#### `clickstack_current`
- **Type**: `Float64`
- **Default**: `0.0`
- **Purpose**: Current value for comparison
- **Usage**: Current state measurement

#### `clickstack_delta_percent`
- **Type**: `Float32`
- **Default**: `0.0`
- **Purpose**: Percentage change from baseline
- **Usage**: Anomaly detection and trend analysis

## Indexes

### 1. ClickStack Version Indexes
```sql
-- Filter by ClickStack version
ALTER TABLE default.logs ADD INDEX idx_clickstack_version (clickstack_version) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.traces ADD INDEX idx_clickstack_version (clickstack_version) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.metric_stream ADD INDEX idx_clickstack_version (clickstack_version) TYPE bloom_filter(0.01) GRANULARITY 1;
```

### 2. Session Replay Indexes
```sql
-- Session and user filtering
ALTER TABLE default.logs ADD INDEX idx_clickstack_session_id (clickstack_session_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX idx_clickstack_user_id (clickstack_user_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX idx_clickstack_session_timestamp (clickstack_session_id, timestamp) TYPE minmax GRANULARITY 1;
```

### 3. Pattern Recognition Indexes
```sql
-- Pattern filtering and analysis
ALTER TABLE default.logs ADD INDEX idx_clickstack_pattern_id (clickstack_pattern_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX idx_clickstack_pattern_type (clickstack_pattern_type) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX idx_clickstack_pattern_confidence (clickstack_pattern_confidence) TYPE minmax GRANULARITY 1;
```

### 4. Event Delta Analysis Indexes
```sql
-- Delta analysis filtering
ALTER TABLE default.logs ADD INDEX idx_clickstack_delta_percent (clickstack_delta_percent) TYPE minmax GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX idx_clickstack_baseline (clickstack_baseline) TYPE minmax GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX idx_clickstack_current (clickstack_current) TYPE minmax GRANULARITY 1;
```

### 5. Composite Indexes
```sql
-- Multi-tenant ClickStack feature indexes
ALTER TABLE default.logs ADD INDEX idx_clickstack_tenant_session (tenant_id, clickstack_session_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX idx_clickstack_tenant_pattern (tenant_id, clickstack_pattern_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX idx_clickstack_tenant_timestamp (tenant_id, clickstack_ingestion_time) TYPE minmax GRANULARITY 1;
```

## Views

### 1. ClickStack Sessions View
```sql
CREATE VIEW clickstack_sessions AS
SELECT 
    tenant_id,
    clickstack_session_id,
    clickstack_user_id,
    clickstack_page_url,
    clickstack_viewport,
    clickstack_user_agent,
    clickstack_events,
    timestamp,
    clickstack_ingestion_time
FROM default.logs 
WHERE clickstack_session_id != '' 
  AND tenant_id = getSetting('force_tenant_id', '');
```

**Purpose**: Provides filtered access to session replay data with tenant isolation.

### 2. ClickStack Patterns View
```sql
CREATE VIEW clickstack_patterns AS
SELECT 
    tenant_id,
    clickstack_pattern_id,
    clickstack_pattern_type,
    clickstack_pattern_confidence,
    clickstack_pattern_occurrences,
    timestamp,
    clickstack_ingestion_time
FROM default.logs 
WHERE clickstack_pattern_id != '' 
  AND tenant_id = getSetting('force_tenant_id', '');
```

**Purpose**: Provides filtered access to pattern recognition data with tenant isolation.

### 3. ClickStack Event Deltas View
```sql
CREATE VIEW clickstack_event_deltas AS
SELECT 
    tenant_id,
    clickstack_baseline,
    clickstack_current,
    clickstack_delta_percent,
    timestamp,
    clickstack_ingestion_time
FROM default.logs 
WHERE clickstack_baseline != 0.0 
  AND tenant_id = getSetting('force_tenant_id', '');
```

**Purpose**: Provides filtered access to event delta analysis data with tenant isolation.

### 4. ClickStack Correlations View
```sql
CREATE VIEW clickstack_correlations AS
SELECT 
    tenant_id,
    clickstack_correlation_id,
    timestamp,
    clickstack_ingestion_time,
    'log' as data_type
FROM default.logs 
WHERE clickstack_correlation_id != ''
UNION ALL
SELECT 
    tenant_id,
    clickstack_correlation_id,
    timestamp,
    clickstack_ingestion_time,
    'trace' as data_type
FROM default.traces 
WHERE clickstack_correlation_id != ''
UNION ALL
SELECT 
    tenant_id,
    clickstack_correlation_id,
    timestamp,
    clickstack_ingestion_time,
    'metric' as data_type
FROM default.metric_stream 
WHERE clickstack_correlation_id != '';
```

**Purpose**: Provides cross-telemetry correlation analysis with tenant isolation.

## Functions

### 1. ClickStack Metadata Functions

#### `clickstack_extract_metadata(metadata, key)`
```sql
CREATE OR REPLACE FUNCTION clickstack_extract_metadata(metadata Map(String, String), key String)
RETURNS String
AS
    metadata[key]
;
```

**Usage**: Extract specific metadata values from ClickStack metadata maps.

#### `clickstack_feature_enabled(metadata, feature)`
```sql
CREATE OR REPLACE FUNCTION clickstack_feature_enabled(metadata Map(String, String), feature String)
RETURNS UInt8
AS
    metadata[feature] = 'true'
;
```

**Usage**: Check if a specific ClickStack feature is enabled for a record.

#### `clickstack_get_version(version)`
```sql
CREATE OR REPLACE FUNCTION clickstack_get_version(version String)
RETURNS String
AS
    if(version = '', '1.0', version)
;
```

**Usage**: Get ClickStack version with fallback to default.

## Query Examples

### 1. Session Replay Analysis
```sql
-- Get all sessions for a specific user
SELECT 
    clickstack_session_id,
    clickstack_page_url,
    clickstack_viewport,
    timestamp
FROM clickstack_sessions
WHERE clickstack_user_id = 'user-123'
ORDER BY timestamp;

-- Get session events for a specific session
SELECT 
    clickstack_events,
    timestamp
FROM clickstack_sessions
WHERE clickstack_session_id = 'sess-abc123'
ORDER BY timestamp;
```

### 2. Pattern Recognition Analysis
```sql
-- Get high-confidence patterns
SELECT 
    clickstack_pattern_id,
    clickstack_pattern_type,
    clickstack_pattern_confidence,
    clickstack_pattern_occurrences
FROM clickstack_patterns
WHERE clickstack_pattern_confidence > 0.8
ORDER BY clickstack_pattern_occurrences DESC;

-- Get patterns by type
SELECT 
    clickstack_pattern_type,
    count() as pattern_count,
    avg(clickstack_pattern_confidence) as avg_confidence
FROM clickstack_patterns
GROUP BY clickstack_pattern_type;
```

### 3. Event Delta Analysis
```sql
-- Get significant anomalies
SELECT 
    clickstack_baseline,
    clickstack_current,
    clickstack_delta_percent,
    timestamp
FROM clickstack_event_deltas
WHERE abs(clickstack_delta_percent) > 10.0
ORDER BY abs(clickstack_delta_percent) DESC;

-- Get trend analysis
SELECT 
    toStartOfHour(timestamp) as hour,
    avg(clickstack_delta_percent) as avg_delta,
    count() as event_count
FROM clickstack_event_deltas
GROUP BY hour
ORDER BY hour;
```

### 4. Cross-Telemetry Correlation
```sql
-- Get correlated data across all telemetry types
SELECT 
    clickstack_correlation_id,
    data_type,
    timestamp,
    clickstack_ingestion_time
FROM clickstack_correlations
WHERE clickstack_correlation_id = 'corr-xyz789'
ORDER BY timestamp;
```

### 5. ClickStack Feature Usage Analysis
```sql
-- Analyze ClickStack feature usage
SELECT 
    clickstack_version,
    clickstack_pipeline_version,
    count() as record_count,
    min(clickstack_ingestion_time) as first_ingestion,
    max(clickstack_ingestion_time) as last_ingestion
FROM default.logs
WHERE clickstack_version != ''
GROUP BY clickstack_version, clickstack_pipeline_version
ORDER BY record_count DESC;
```

## Performance Considerations

### 1. Index Optimization
- **Bloom Filter Indexes**: Used for high-cardinality string columns
- **MinMax Indexes**: Used for numeric ranges and timestamps
- **Composite Indexes**: Optimized for multi-tenant queries

### 2. Compression
- **ZSTD(1)**: Used for all ClickStack columns for optimal compression
- **Default Values**: Reduce storage for unused features
- **Nullable Columns**: Minimize storage overhead

### 3. Query Optimization
- **Views**: Provide pre-filtered access with tenant isolation
- **Functions**: Optimize common ClickStack operations
- **Indexes**: Accelerate ClickStack-specific queries

## Migration Strategy

### 1. Backward Compatibility
- All ClickStack columns have default values
- Existing queries continue to work unchanged
- Gradual feature enablement per tenant

### 2. Rollback Capability
- Complete down migration available
- No data loss during rollback
- Feature flags for gradual disablement

### 3. Performance Impact
- Minimal impact on existing queries
- Indexes created with minimal locking
- Background index building for large tables

## Monitoring and Maintenance

### 1. Schema Health Checks
```sql
-- Check ClickStack column usage
SELECT 
    name,
    type,
    default_expression
FROM system.columns
WHERE table = 'logs' 
  AND database = 'default'
  AND name LIKE 'clickstack_%'
ORDER BY name;
```

### 2. Index Performance Monitoring
```sql
-- Monitor index usage
SELECT 
    table,
    name,
    type,
    expr
FROM system.data_skipping_indices
WHERE table = 'logs' 
  AND database = 'default'
  AND name LIKE 'idx_clickstack_%'
ORDER BY name;
```

### 3. Storage Optimization
```sql
-- Monitor ClickStack storage usage
SELECT 
    table,
    name,
    type,
    compression_codec,
    data_compressed_bytes,
    data_uncompressed_bytes
FROM system.columns
WHERE table = 'logs' 
  AND database = 'default'
  AND name LIKE 'clickstack_%'
ORDER BY data_compressed_bytes DESC;
```

## Conclusion

The ClickStack ClickHouse schema extensions provide a robust foundation for advanced observability features while maintaining full tenant isolation and backward compatibility. The schema is designed for performance, scalability, and ease of use, enabling powerful ClickStack features without compromising the existing multi-tenant architecture.
