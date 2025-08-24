-- Rollback multi-tenant support migration
-- WARNING: This will remove tenant isolation - use with extreme caution

-- Drop tenant isolation views
DROP VIEW IF EXISTS tenant_logs;
DROP VIEW IF EXISTS tenant_traces;
DROP VIEW IF EXISTS tenant_metrics;

-- Drop tenant-specific indexes
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_tenant_timestamp;
ALTER TABLE default.logs DROP INDEX IF EXISTS idx_tenant_bloom;

ALTER TABLE default.traces DROP INDEX IF EXISTS idx_tenant_timestamp;
ALTER TABLE default.traces DROP INDEX IF EXISTS idx_tenant_bloom;

ALTER TABLE default.metric_stream DROP INDEX IF EXISTS idx_tenant_timestamp;
ALTER TABLE default.metric_stream DROP INDEX IF EXISTS idx_tenant_bloom;

-- Remove tenant_id columns
-- NOTE: This will lose tenant association data permanently
-- ALTER TABLE default.logs DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE default.traces DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE default.metric_stream DROP COLUMN IF EXISTS tenant_id;

-- Column removal is commented out to prevent accidental data loss
-- Uncomment the above lines only if you're certain about removing tenant data