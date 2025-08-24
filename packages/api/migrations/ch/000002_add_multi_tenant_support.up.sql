-- Add tenant_id columns to all observability data tables
-- This migration adds multi-tenant support to HyperDX

-- Add tenant_id to logs table
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS tenant_id String DEFAULT '' CODEC(ZSTD(1));

-- Add tenant_id to traces table  
ALTER TABLE default.traces ADD COLUMN IF NOT EXISTS tenant_id String DEFAULT '' CODEC(ZSTD(1));

-- Add tenant_id to metric_stream table
ALTER TABLE default.metric_stream ADD COLUMN IF NOT EXISTS tenant_id String DEFAULT '' CODEC(ZSTD(1));

-- Create optimized indexes for tenant-based filtering
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_tenant_timestamp (tenant_id, timestamp) TYPE minmax GRANULARITY 1;
ALTER TABLE default.traces ADD INDEX IF NOT EXISTS idx_tenant_timestamp (tenant_id, timestamp) TYPE minmax GRANULARITY 1;  
ALTER TABLE default.metric_stream ADD INDEX IF NOT EXISTS idx_tenant_timestamp (tenant_id, timestamp) TYPE minmax GRANULARITY 1;

-- Create bloom filter indexes for efficient tenant filtering
ALTER TABLE default.logs ADD INDEX IF NOT EXISTS idx_tenant_bloom (tenant_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.traces ADD INDEX IF NOT EXISTS idx_tenant_bloom (tenant_id) TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE default.metric_stream ADD INDEX IF NOT EXISTS idx_tenant_bloom (tenant_id) TYPE bloom_filter(0.01) GRANULARITY 1;

-- Create tenant isolation views for additional security (optional)
CREATE VIEW IF NOT EXISTS tenant_logs AS
SELECT * FROM default.logs 
WHERE tenant_id = getSetting('force_tenant_id', '');

CREATE VIEW IF NOT EXISTS tenant_traces AS  
SELECT * FROM default.traces
WHERE tenant_id = getSetting('force_tenant_id', '');

CREATE VIEW IF NOT EXISTS tenant_metrics AS
SELECT * FROM default.metric_stream
WHERE tenant_id = getSetting('force_tenant_id', '');

-- Add comment for documentation
COMMENT ON TABLE default.logs 'Multi-tenant logs with tenant_id isolation';
COMMENT ON TABLE default.traces 'Multi-tenant traces with tenant_id isolation';
COMMENT ON TABLE default.metric_stream 'Multi-tenant metrics with tenant_id isolation';