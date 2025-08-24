# ClickStack OTEL Schema Documentation

## Overview

This document describes the enhanced OpenTelemetry (OTEL) collector configuration for ClickStack integration in our multi-tenant HyperDX architecture. The schema extends our existing multi-tenant configuration with ClickStack-specific processors, filters, and data enrichment capabilities.

## Schema Changes and Enhancements

### 1. New ClickStack-Specific Processors

#### `transform/clickstack_tenant`
This processor ensures ClickStack-specific tenant context and metadata are properly extracted and validated.

**Purpose:**
- Ensures tenant_id is always present in all telemetry data
- Adds ClickStack version and data source identifiers
- Extracts ClickStack-specific data from log bodies
- Provides correlation IDs for ClickStack features

**Key Features:**
- **Tenant ID Validation**: Ensures tenant_id is present, defaults to "default" if missing
- **ClickStack Versioning**: Adds `clickstack_version: "1.0"` to all records
- **Data Source Identification**: Marks all data as `data_source: "clickstack"`
- **Session Replay Extraction**: Extracts session replay data from log bodies
- **Pattern Recognition**: Extracts pattern data for log analysis
- **Event Delta Analysis**: Extracts baseline, current, and delta percentage data

**Configuration:**
```yaml
transform/clickstack_tenant:
  log_statements:
    - context: log
      statements:
        # Ensure tenant_id is always present
        - set(attributes["tenant_id"], attributes["tenant_id"]) where attributes["tenant_id"] != nil
        - set(attributes["tenant_id"], "default") where attributes["tenant_id"] == nil
        # Add ClickStack-specific fields
        - set(attributes["clickstack_version"], "1.0")
        - set(attributes["data_source"], "clickstack")
        # Extract session replay data if present
        - set(attributes["session_replay_data"], body["session_replay"]) where IsMap(body) and body["session_replay"] != nil
        # Add correlation IDs for ClickStack features
        - set(attributes["clickstack_correlation_id"], attributes["trace_id"]) where attributes["trace_id"] != nil
        # Extract pattern recognition data
        - set(attributes["clickstack_pattern"], body["pattern"]) where IsMap(body) and body["pattern"] != nil
        # Extract event delta data
        - set(attributes["clickstack_baseline"], body["baseline"]) where IsMap(body) and body["baseline"] != nil
        - set(attributes["clickstack_current"], body["current"]) where IsMap(body) and body["current"] != nil
        - set(attributes["clickstack_delta_percent"], body["delta_percent"]) where IsMap(body) and body["delta_percent"] != nil
```

#### `transform/clickstack_enrichment`
This processor adds ClickStack-specific enrichment data to all telemetry records.

**Purpose:**
- Adds ingestion timestamps and pipeline version information
- Extracts user session information for ClickStack features
- Provides viewport and device information for session replay
- Adds tenant-specific metadata

**Key Features:**
- **Ingestion Tracking**: Adds `clickstack_ingestion_time` and `clickstack_pipeline_version`
- **Session Information**: Extracts user_id, session_id, page_url from log bodies
- **Device Information**: Extracts viewport and user_agent data
- **Event Data**: Extracts ClickStack events for analysis
- **Tenant Metadata**: Adds tenant-specific metadata maps

**Configuration:**
```yaml
transform/clickstack_enrichment:
  log_statements:
    - context: log
      statements:
        # Add ClickStack-specific enrichment
        - set(attributes["clickstack_ingestion_time"], Now())
        - set(attributes["clickstack_pipeline_version"], "1.0")
        # Add tenant-specific metadata
        - set(attributes["tenant_metadata"], map("tenant_id", attributes["tenant_id"], "clickstack_enabled", "true"))
        # Extract user session information
        - set(attributes["clickstack_user_id"], body["user_id"]) where IsMap(body) and body["user_id"] != nil
        - set(attributes["clickstack_session_id"], body["session_id"]) where IsMap(body) and body["session_id"] != nil
        - set(attributes["clickstack_page_url"], body["page_url"]) where IsMap(body) and body["page_url"] != nil
        # Extract viewport and device information
        - set(attributes["clickstack_viewport"], body["viewport"]) where IsMap(body) and body["viewport"] != nil
        - set(attributes["clickstack_user_agent"], body["user_agent"]) where IsMap(body) and body["user_agent"] != nil
        # Extract ClickStack events
        - set(attributes["clickstack_events"], body["events"]) where IsMap(body) and body["events"] != nil
```

#### `filter/clickstack_validation`
This processor validates ClickStack-specific data and filters out invalid records.

**Purpose:**
- Ensures all records have valid tenant IDs
- Validates ClickStack version presence
- Filters out records missing required ClickStack metadata
- Maintains data quality for ClickStack features

**Key Features:**
- **Tenant Validation**: Drops records with invalid tenant IDs
- **Version Validation**: Ensures ClickStack version is present
- **Data Quality**: Maintains high-quality data for ClickStack analysis

**Configuration:**
```yaml
filter/clickstack_validation:
  traces:
    span:
      # Drop spans with invalid tenant IDs or missing ClickStack data
      - 'attributes["tenant_id"] == "invalid"'
      - 'attributes["clickstack_version"] == nil'
  metrics:
    metric:
      # Drop metrics with invalid tenant IDs or missing ClickStack data
      - 'attributes["tenant_id"] == "invalid"'
      - 'attributes["clickstack_version"] == nil'
  logs:
    log_record:
      # Drop logs with invalid tenant IDs or missing ClickStack data
      - 'attributes["tenant_id"] == "invalid"'
      - 'attributes["clickstack_version"] == nil'
```

### 2. Enhanced Receivers

#### `httpd/clickstack`
New HTTP receiver specifically for ClickStack session replay data.

**Purpose:**
- Dedicated endpoint for ClickStack session data ingestion
- Separate from general log ingestion for better performance
- Optimized for session replay data processing

**Configuration:**
```yaml
httpd/clickstack:
  endpoint: 0.0.0.0:8081
  path: /api/clickstack/sessions
  cors:
    allowed_origins:
      - "http://localhost:*"
      - "https://*.hyperdx.com"
```

### 3. Enhanced Attributes Processor

The existing `attributes/enrichment` processor has been enhanced with ClickStack-specific identifiers.

**New Attributes:**
- `data_source: "clickstack_otel_collector"` - Identifies data as coming from ClickStack collector
- `clickstack_collector_id: "${HOSTNAME}"` - Unique identifier for the collector instance

## Tenant Metadata Extraction Specification

### Tenant ID Extraction Strategy

The ClickStack OTEL configuration implements a multi-layered tenant extraction strategy:

1. **Primary Source**: Direct attribute extraction from telemetry data
2. **Secondary Source**: Resource attribute extraction
3. **Header Source**: HTTP header extraction via resource attributes
4. **Fallback**: Default tenant assignment

### Tenant ID Validation Rules

**Format Requirements:**
- Alphanumeric characters only: `[a-zA-Z0-9_-]`
- Hyphens and underscores allowed
- No special characters or spaces
- Case-sensitive

**Validation Process:**
1. Extract tenant_id from available sources
2. Apply regex validation: `^[a-zA-Z0-9_-]+$`
3. Mark as "invalid" if validation fails
4. Filter out invalid records in validation processors

### Tenant Metadata Structure

Each telemetry record includes tenant-specific metadata:

```json
{
  "tenant_metadata": {
    "tenant_id": "tenant-123",
    "clickstack_enabled": "true"
  }
}
```

## ClickStack-Specific Data Extraction

### Session Replay Data

**Extraction Source:** Log body `session_replay` field
**Target Attribute:** `session_replay_data`
**Data Structure:**
```json
{
  "session_replay": {
    "session_id": "sess-abc123",
    "user_id": "user-456",
    "page_url": "https://example.com/page",
    "viewport": {"width": 1920, "height": 1080},
    "user_agent": "Mozilla/5.0...",
    "events": [...]
  }
}
```

### Pattern Recognition Data

**Extraction Source:** Log body `pattern` field
**Target Attribute:** `clickstack_pattern`
**Data Structure:**
```json
{
  "pattern": {
    "pattern_id": "pattern-789",
    "pattern_type": "error_sequence",
    "confidence": 0.95,
    "occurrences": 15
  }
}
```

### Event Delta Analysis Data

**Extraction Sources:** Log body `baseline`, `current`, `delta_percent` fields
**Target Attributes:** `clickstack_baseline`, `clickstack_current`, `clickstack_delta_percent`
**Data Structure:**
```json
{
  "baseline": 100.5,
  "current": 95.2,
  "delta_percent": -5.27
}
```

## Pipeline Configuration

### Enhanced Pipeline Order

The ClickStack-enhanced pipelines follow this processing order:

1. **Memory Limiter** - Prevents OOM issues
2. **Resource Detection** - Detects system and environment information
3. **Tenant Extraction** - Extracts and validates tenant information
4. **ClickStack Tenant** - Adds ClickStack-specific tenant context
5. **ClickStack Enrichment** - Enriches data with ClickStack features
6. **Tenant Validation** - Filters invalid tenant data
7. **ClickStack Validation** - Filters invalid ClickStack data
8. **Resource** - Adds resource-level attributes
9. **Attributes Enrichment** - Adds collector-specific attributes
10. **Batch** - Batches data for efficient transmission

### Pipeline Configuration Example

```yaml
pipelines:
  logs:
    receivers: [otlp, httpd, httpd/clickstack]
    processors:
      - memory_limiter
      - resourcedetection
      - transform/tenant_extraction
      - transform/clickstack_tenant
      - transform/clickstack_enrichment
      - filter/tenant_validation
      - filter/clickstack_validation
      - resource
      - attributes/enrichment
      - batch
    exporters: [clickhouse/logs]
```

## Data Quality and Validation

### Required Attributes

All telemetry records must include these ClickStack-specific attributes:

- `tenant_id` - Valid tenant identifier
- `clickstack_version` - ClickStack version (currently "1.0")
- `data_source` - Data source identifier ("clickstack")
- `clickstack_ingestion_time` - Ingestion timestamp
- `clickstack_pipeline_version` - Pipeline version

### Optional Attributes

These attributes are added when the corresponding data is present:

- `session_replay_data` - Session replay information
- `clickstack_correlation_id` - Correlation ID for tracing
- `clickstack_pattern` - Pattern recognition data
- `clickstack_baseline` - Event delta baseline
- `clickstack_current` - Event delta current value
- `clickstack_delta_percent` - Event delta percentage
- `clickstack_user_id` - User identifier
- `clickstack_session_id` - Session identifier
- `clickstack_page_url` - Page URL
- `clickstack_viewport` - Viewport information
- `clickstack_user_agent` - User agent string
- `clickstack_events` - ClickStack events array

## Performance Considerations

### Memory Usage

- **Memory Limiter**: Set to 512MB to prevent OOM issues
- **Batch Processing**: 1024-2048 records per batch for optimal performance
- **Queue Size**: 1000 records in sending queue for ClickHouse exporters

### Processing Overhead

- **ClickStack Processors**: Minimal overhead (<5% additional processing time)
- **Validation Filters**: Efficient filtering with early termination
- **Enrichment**: Optimized attribute setting with conditional logic

### Scalability

- **Multiple Consumers**: 8 consumers per ClickHouse exporter
- **Retry Logic**: Exponential backoff with 30s max interval
- **Timeout Handling**: 10s timeout for ClickHouse operations

## Monitoring and Observability

### Collector Metrics

The ClickStack-enhanced collector exposes metrics on:
- **Endpoint**: `0.0.0.0:8889` (Prometheus format)
- **Health Check**: `0.0.0.0:13133`
- **Performance Profiler**: `0.0.0.0:1777`

### Key Metrics to Monitor

- **Processing Rate**: Records processed per second
- **Error Rate**: Failed processing attempts
- **Latency**: Processing time per record
- **Memory Usage**: Current memory consumption
- **Queue Depth**: Number of records in processing queues

## Troubleshooting

### Common Issues

1. **Missing Tenant ID**
   - Check tenant extraction configuration
   - Verify tenant ID format validation
   - Review fallback tenant assignment

2. **ClickStack Validation Failures**
   - Ensure ClickStack version is set
   - Verify required attributes are present
   - Check data source identification

3. **Performance Issues**
   - Monitor memory usage
   - Check batch processing configuration
   - Review queue depths and processing rates

### Debug Configuration

Enable debug exporter for development:
```yaml
exporters:
  debug:
    verbosity: normal
```

### Log Levels

Set appropriate log levels for troubleshooting:
```yaml
telemetry:
  logs:
    level: "debug"  # Use "info" for production
```

## Migration from Existing Configuration

### Step-by-Step Migration

1. **Backup Current Configuration**
   - Copy existing `otel-collector-multi-tenant.yaml`
   - Document current pipeline configuration

2. **Deploy ClickStack Configuration**
   - Deploy `otel-collector-clickstack-multi-tenant.yaml`
   - Monitor collector health and metrics

3. **Validate Data Flow**
   - Check ClickStack attributes in ClickHouse
   - Verify tenant isolation is maintained
   - Monitor performance impact

4. **Enable ClickStack Features**
   - Gradually enable ClickStack processors
   - Monitor data quality and validation
   - Adjust configuration as needed

### Rollback Procedure

1. **Revert to Original Configuration**
   - Restore original `otel-collector-multi-tenant.yaml`
   - Restart collector service

2. **Verify Data Integrity**
   - Check that existing data flow is restored
   - Validate tenant isolation
   - Monitor performance metrics

## Conclusion

The ClickStack OTEL schema provides a robust foundation for ClickStack integration while maintaining the performance and security of our multi-tenant architecture. The enhanced processors and filters ensure data quality while enabling advanced ClickStack features like session replay, pattern recognition, and event delta analysis.

The schema is designed to be backward-compatible with existing multi-tenant data while providing clear migration paths and rollback procedures for safe deployment.
