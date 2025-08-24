-- Add ClickStack-specific columns and indexes to observability data tables
-- This migration adds ClickStack features support to HyperDX multi-tenant architecture

-- ============================================================================
-- LOGS TABLE EXTENSIONS
-- ============================================================================

-- Add ClickStack-specific columns to logs table
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_version String DEFAULT '1.0' CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_ingestion_time DateTime64(3) DEFAULT now() CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_pipeline_version String DEFAULT '1.0' CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_correlation_id String DEFAULT '' CODEC(ZSTD(1));

-- Add ClickStack metadata column for flexible ClickStack-specific data
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));

-- Add session replay specific columns
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_session_id String DEFAULT '' CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_user_id String DEFAULT '' CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_page_url String DEFAULT '' CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_viewport Map(String, UInt32) DEFAULT map() CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_user_agent String DEFAULT '' CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_events Array(String) DEFAULT [] CODEC(ZSTD(1));

-- Add pattern recognition specific columns
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_pattern_id String DEFAULT '' CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_pattern_type String DEFAULT '' CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_pattern_confidence Float32 DEFAULT 0.0 CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_pattern_occurrences UInt32 DEFAULT 0 CODEC(ZSTD(1));

-- Add event delta analysis specific columns
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_baseline Float64 DEFAULT 0.0 CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_current Float64 DEFAULT 0.0 CODEC(ZSTD(1));
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_delta_percent Float32 DEFAULT 0.0 CODEC(ZSTD(1));

-- ============================================================================
-- TRACES TABLE EXTENSIONS
-- ============================================================================

-- Add ClickStack-specific columns to traces table
ALTER TABLE default.traces ADD COLUMN IF NOT EXISTS clickstack_version String DEFAULT '1.0' CODEC(ZSTD(1));
ALTER TABLE default.traces ADD COLUMN IF NOT EXISTS clickstack_ingestion_time DateTime64(3) DEFAULT now() CODEC(ZSTD(1));
ALTER TABLE default.traces ADD COLUMN IF NOT EXISTS clickstack_pipeline_version String DEFAULT '1.0' CODEC(ZSTD(1));
ALTER TABLE default.traces ADD COLUMN IF NOT EXISTS clickstack_correlation_id String DEFAULT '' CODEC(ZSTD(1));

-- Add ClickStack metadata column for traces
ALTER TABLE default.traces ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));

-- ============================================================================
-- METRICS TABLE EXTENSIONS
-- ============================================================================

-- Add ClickStack-specific columns to metric_stream table
ALTER TABLE default.metric_stream ADD COLUMN IF NOT EXISTS clickstack_version String DEFAULT '1.0' CODEC(ZSTD(1));
ALTER TABLE default.metric_stream ADD COLUMN IF NOT EXISTS clickstack_ingestion_time DateTime64(3) DEFAULT now() CODEC(ZSTD(1));
ALTER TABLE default.metric_stream ADD COLUMN IF NOT EXISTS clickstack_pipeline_version String DEFAULT '1.0' CODEC(ZSTD(1));
ALTER TABLE default.metric_stream ADD COLUMN IF NOT EXISTS clickstack_correlation_id String DEFAULT '' CODEC(ZSTD(1));

-- Add ClickStack metadata column for metrics
ALTER TABLE default.metric_stream ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));

-- ============================================================================
-- CLICKSTACK-SPECIFIC INDEXES
-- ============================================================================

-- Create ClickStack version indexes for filtering by ClickStack version
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_version (clickstack_version) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.traces ADD INDEX IF NOT EXISTS idx_clickstack_version (clickstack_version) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.metric_stream ADD INDEX IF NOT EXISTS idx_clickstack_version (clickstack_version) TYPE bloom_filter(0.01) GRANULARITY 1;

-- Create session replay indexes
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_session_id (clickstack_session_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_user_id (clickstack_user_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_session_timestamp (clickstack_session_id, timestamp) TYPE minmax GRANULARITY 1;

-- Create pattern recognition indexes
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_pattern_id (clickstack_pattern_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_pattern_type (clickstack_pattern_type) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_pattern_confidence (clickstack_pattern_confidence) TYPE minmax GRANULARITY 1;

-- Create event delta analysis indexes
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_delta_percent (clickstack_delta_percent) TYPE minmax GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_baseline (clickstack_baseline) TYPE minmax GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_current (clickstack_current) TYPE minmax GRANULARITY 1;

-- Create composite indexes for ClickStack features
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_tenant_session (tenant_id, clickstack_session_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_tenant_pattern (tenant_id, clickstack_pattern_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_clickstack_tenant_timestamp (tenant_id, clickstack_ingestion_time) TYPE minmax GRANULARITY 1;

-- ============================================================================
-- CLICKSTACK-SPECIFIC VIEWS
-- ============================================================================

-- Create ClickStack session replay view
CREATE VIEW IF NOT EXISTS clickstack_sessions AS
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

-- Create ClickStack pattern recognition view
CREATE VIEW IF NOT EXISTS clickstack_patterns AS
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

-- Create ClickStack event delta analysis view
CREATE VIEW IF NOT EXISTS clickstack_event_deltas AS
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

-- Create ClickStack correlation view for tracing
CREATE VIEW IF NOT EXISTS clickstack_correlations AS
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

-- ============================================================================
-- CLICKSTACK METADATA FUNCTIONS
-- ============================================================================

-- Function to extract ClickStack metadata
CREATE OR REPLACE FUNCTION clickstack_extract_metadata(metadata Map(String, String), key String)
RETURNS String
AS
    metadata[key]
;

-- Function to check if ClickStack feature is enabled
CREATE OR REPLACE FUNCTION clickstack_feature_enabled(metadata Map(String, String), feature String)
RETURNS UInt8
AS
    metadata[feature] = 'true'
;

-- Function to get ClickStack version
CREATE OR REPLACE FUNCTION clickstack_get_version(version String)
RETURNS String
AS
    if(version = '', '1.0', version)
;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Add comments for ClickStack columns
COMMENT ON COLUMN default.logs.clickstack_version IS 'ClickStack version identifier';
COMMENT ON COLUMN default.logs.clickstack_ingestion_time IS 'ClickStack ingestion timestamp';
COMMENT ON COLUMN default.logs.clickstack_pipeline_version IS 'ClickStack pipeline version';
COMMENT ON COLUMN default.logs.clickstack_correlation_id IS 'ClickStack correlation ID for tracing';
COMMENT ON COLUMN default.logs.clickstack_metadata IS 'ClickStack-specific metadata map';
COMMENT ON COLUMN default.logs.clickstack_session_id IS 'Session replay session identifier';
COMMENT ON COLUMN default.logs.clickstack_user_id IS 'Session replay user identifier';
COMMENT ON COLUMN default.logs.clickstack_page_url IS 'Session replay page URL';
COMMENT ON COLUMN default.logs.clickstack_viewport IS 'Session replay viewport dimensions';
COMMENT ON COLUMN default.logs.clickstack_user_agent IS 'Session replay user agent';
COMMENT ON COLUMN default.logs.clickstack_events IS 'Session replay events array';
COMMENT ON COLUMN default.logs.clickstack_pattern_id IS 'Pattern recognition pattern identifier';
COMMENT ON COLUMN default.logs.clickstack_pattern_type IS 'Pattern recognition pattern type';
COMMENT ON COLUMN default.logs.clickstack_pattern_confidence IS 'Pattern recognition confidence score';
COMMENT ON COLUMN default.logs.clickstack_pattern_occurrences IS 'Pattern recognition occurrence count';
COMMENT ON COLUMN default.logs.clickstack_baseline IS 'Event delta analysis baseline value';
COMMENT ON COLUMN default.logs.clickstack_current IS 'Event delta analysis current value';
COMMENT ON COLUMN default.logs.clickstack_delta_percent IS 'Event delta analysis percentage change';

-- Add comments for ClickStack views
COMMENT ON VIEW clickstack_sessions IS 'ClickStack session replay data view';
COMMENT ON VIEW clickstack_patterns IS 'ClickStack pattern recognition data view';
COMMENT ON VIEW clickstack_event_deltas IS 'ClickStack event delta analysis data view';
COMMENT ON VIEW clickstack_correlations IS 'ClickStack correlation data across all telemetry types';

-- Add table comments
COMMENT ON TABLE default.logs IS 'Multi-tenant logs with ClickStack features support';
COMMENT ON TABLE default.traces IS 'Multi-tenant traces with ClickStack features support';
COMMENT ON TABLE default.metric_stream IS 'Multi-tenant metrics with ClickStack features support';
