-- Remove ClickStack-specific columns and indexes from observability data tables
-- This migration removes ClickStack features support from HyperDX multi-tenant architecture

-- ============================================================================
-- REMOVE CLICKSTACK-SPECIFIC VIEWS
-- ============================================================================

DROP VIEW IF EXISTS clickstack_sessions;
DROP VIEW IF EXISTS clickstack_patterns;
DROP VIEW IF EXISTS clickstack_event_deltas;
DROP VIEW IF EXISTS clickstack_correlations;

-- ============================================================================
-- REMOVE CLICKSTACK METADATA FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS clickstack_extract_metadata;
DROP FUNCTION IF EXISTS clickstack_feature_enabled;
DROP FUNCTION IF EXISTS clickstack_get_version;

-- ============================================================================
-- REMOVE CLICKSTACK-SPECIFIC INDEXES
-- ============================================================================

-- Remove ClickStack version indexes
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_version;
ALTER TABLE default.traces DROP INDEX IF EXISTS idx_clickstack_version;
ALTER TABLE default.metric_stream DROP INDEX IF EXISTS idx_clickstack_version;

-- Remove session replay indexes
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_session_id;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_user_id;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_session_timestamp;

-- Remove pattern recognition indexes
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_pattern_id;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_pattern_type;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_pattern_confidence;

-- Remove event delta analysis indexes
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_delta_percent;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_baseline;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_current;

-- Remove composite indexes for ClickStack features
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_tenant_session;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_tenant_pattern;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_clickstack_tenant_timestamp;

-- ============================================================================
-- REMOVE CLICKSTACK-SPECIFIC COLUMNS FROM LOGS TABLE
-- ============================================================================

-- Remove ClickStack-specific columns from logs table
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_version;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_ingestion_time;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_pipeline_version;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_correlation_id;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_metadata;

-- Remove session replay specific columns
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_session_id;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_user_id;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_page_url;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_viewport;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_user_agent;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_events;

-- Remove pattern recognition specific columns
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_pattern_id;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_pattern_type;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_pattern_confidence;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_pattern_occurrences;

-- Remove event delta analysis specific columns
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_baseline;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_current;
ALTER TABLE default.logs DROP COLUMN IF EXISTS clickstack_delta_percent;

-- ============================================================================
-- REMOVE CLICKSTACK-SPECIFIC COLUMNS FROM TRACES TABLE
-- ============================================================================

-- Remove ClickStack-specific columns from traces table
ALTER TABLE default.traces DROP COLUMN IF EXISTS clickstack_version;
ALTER TABLE default.traces DROP COLUMN IF EXISTS clickstack_ingestion_time;
ALTER TABLE default.traces DROP COLUMN IF EXISTS clickstack_pipeline_version;
ALTER TABLE default.traces DROP COLUMN IF EXISTS clickstack_correlation_id;
ALTER TABLE default.traces DROP COLUMN IF EXISTS clickstack_metadata;

-- ============================================================================
-- REMOVE CLICKSTACK-SPECIFIC COLUMNS FROM METRICS TABLE
-- ============================================================================

-- Remove ClickStack-specific columns from metric_stream table
ALTER TABLE default.metric_stream DROP COLUMN IF EXISTS clickstack_version;
ALTER TABLE default.metric_stream DROP COLUMN IF EXISTS clickstack_ingestion_time;
ALTER TABLE default.metric_stream DROP COLUMN IF EXISTS clickstack_pipeline_version;
ALTER TABLE default.metric_stream DROP COLUMN IF EXISTS clickstack_correlation_id;
ALTER TABLE default.metric_stream DROP COLUMN IF EXISTS clickstack_metadata;

-- ============================================================================
-- RESTORE ORIGINAL TABLE COMMENTS
-- ============================================================================

-- Restore original table comments
COMMENT ON TABLE default.logs IS 'Multi-tenant logs with tenant_id isolation';
COMMENT ON TABLE default.traces IS 'Multi-tenant traces with tenant_id isolation';
COMMENT ON TABLE default.metric_stream IS 'Multi-tenant metrics with tenant_id isolation';
