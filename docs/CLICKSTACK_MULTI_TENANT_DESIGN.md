# ClickStack Multi-Tenant Integration Design

## Executive Summary

This design document outlines the comprehensive integration of ClickStack observability components into our existing multi-tenant HyperDX architecture. ClickStack provides a production-grade observability platform built on ClickHouse, unifying logs, traces, metrics, and session replays in a single high-performance solution.

## Current State Analysis

### Existing Multi-Tenant Architecture
- **Frontend**: Next.js React app with tenant-aware context
- **Backend API**: Express.js with MongoDB metadata storage and tenant middleware
- **Data Storage**: ClickHouse with tenant_id columns and row-level security
- **Ingestion**: OpenTelemetry Collector with tenant extraction and filtering
- **Authentication**: JWT-based tenant identification and validation

### ClickStack Components to Integrate
1. **HyperDX UI** - Purpose-built frontend for observability data exploration
2. **OpenTelemetry Collector** - Custom-built collector with opinionated schema
3. **ClickHouse** - High-performance analytical database (already integrated)
4. **MongoDB** - Application state storage (already integrated)

## ClickStack Multi-Tenant Architecture Design

### 1. Enhanced OTEL Collector Configuration

#### Current Multi-Tenant OTEL Configuration
Our existing `otel-collector-multi-tenant.yaml` already includes:
- Tenant extraction from headers, attributes, and resource context
- Tenant validation and filtering
- Automatic tenant_id injection into all telemetry data

#### ClickStack Enhancements Required
```yaml
# Enhanced tenant-aware ClickStack OTEL config
processors:
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

  transform/clickstack_enrichment:
    log_statements:
      - context: log
        statements:
          # Add ClickStack-specific enrichment
          - set(attributes["clickstack_ingestion_time"], Now())
          - set(attributes["clickstack_pipeline_version"], "1.0")
          # Add tenant-specific metadata
          - set(attributes["tenant_metadata"], map("tenant_id", attributes["tenant_id"], "clickstack_enabled", "true"))

  filter/clickstack_validation:
    logs:
      log_record:
        # Validate ClickStack-specific data
        - 'attributes["tenant_id"] != nil'
        - 'attributes["clickstack_ingestion_time"] != nil'
```

### 2. ClickStack Database Schema Extensions

#### Current ClickHouse Schema
Our existing multi-tenant schema includes:
- `tenant_id` columns in all observability tables
- Tenant-aware indexes for optimized filtering
- Row-level security through automatic query filtering

#### ClickStack Schema Enhancements
```sql
-- ClickStack-compatible tenant-aware schema extensions
-- Add ClickStack-specific metadata columns
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));
ALTER TABLE default.traces ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));
ALTER TABLE default.metric_stream ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));

-- Add ClickStack-specific indexes for tenant isolation
CREATE INDEX IF NOT EXISTS idx_clickstack_tenant_timestamp ON default.logs (tenant_id, timestamp) TYPE minmax GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_clickstack_tenant_service ON default.logs (tenant_id, ServiceName) TYPE bloom_filter(0.01) GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_clickstack_tenant_session ON default.logs (tenant_id, clickstack_metadata['session_id']) TYPE bloom_filter(0.01) GRANULARITY 1;

-- ClickStack-specific views for tenant isolation
CREATE VIEW IF NOT EXISTS clickstack_tenant_logs AS
SELECT * FROM default.logs 
WHERE tenant_id = getSetting('tenant_id', '')
AND clickstack_metadata != map();

-- ClickStack dashboard storage
CREATE TABLE IF NOT EXISTS clickstack_dashboards (
    id UUID DEFAULT generateUUIDv4(),
    tenant_id String,
    name String,
    description String,
    config String, -- JSON configuration
    created_at DateTime64(3) DEFAULT now(),
    updated_at DateTime64(3) DEFAULT now(),
    created_by String,
    is_public Boolean DEFAULT false
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at)
PARTITION BY tenant_id;

-- ClickStack alerts storage
CREATE TABLE IF NOT EXISTS clickstack_alerts (
    id UUID DEFAULT generateUUIDv4(),
    tenant_id String,
    name String,
    description String,
    query String,
    condition String, -- JSON alert condition
    status String DEFAULT 'active',
    created_at DateTime64(3) DEFAULT now(),
    updated_at DateTime64(3) DEFAULT now(),
    created_by String
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at)
PARTITION BY tenant_id;
```

### 3. Enhanced Team Model for ClickStack

#### Current Team Model
```typescript
export type ITeam = {
  _id: ObjectId;
  name: string;
  tenantId: string;
  apiKey: string;
  hookId: string;
  collectorAuthenticationEnforced: boolean;
  settings?: {
    dataRetentionDays?: number;
    maxUsersPerTenant?: number;
    allowedIngestionRate?: number;
  };
} & TeamCHSettings;
```

#### ClickStack-Enhanced Team Model
```typescript
export type ITeam = {
  _id: ObjectId;
  name: string;
  tenantId: string;
  apiKey: string;
  hookId: string;
  collectorAuthenticationEnforced: boolean;
  // ClickStack-specific settings
  clickstack?: {
    enabled: boolean;
    features: {
      sessionReplay: boolean;
      advancedSearch: boolean;
      customDashboards: boolean;
      alerting: boolean;
      patternRecognition: boolean;
      eventDeltas: boolean;
    };
    limits: {
      maxDashboards: number;
      maxAlerts: number;
      dataRetentionDays: number;
      maxQueryTime: number;
      maxSessionsPerDay: number;
      maxCustomFields: number;
    };
    ui: {
      defaultTimeRange: string;
      theme: 'light' | 'dark';
      customBranding?: {
        logo?: string;
        colors?: Record<string, string>;
        companyName?: string;
      };
    };
    integrations: {
      openTelemetry: boolean;
      vector: boolean;
      fluentd: boolean;
      customCollectors: string[];
    };
  };
  settings?: {
    dataRetentionDays?: number;
    maxUsersPerTenant?: number;
    allowedIngestionRate?: number;
  };
} & TeamCHSettings;
```

### 4. ClickStack Multi-Tenant API Layer

#### New ClickStack API Endpoints
```typescript
// packages/api/src/routers/api/clickstack.ts
import { Router } from 'express';
import { tenantMiddleware, TenantRequest } from '@/middleware/tenant';
import { clickhouse } from '@/clickhouse';

export const clickstackRouter = Router();

// ClickStack Dashboard Management
clickstackRouter.get('/dashboards', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenantId = req.tenant!.id;
  
  const dashboards = await clickhouse.query(`
    SELECT * FROM clickstack_dashboards 
    WHERE tenant_id = {tenant_id:String}
    ORDER BY updated_at DESC
  `, { tenant_id: tenantId });
  
  res.json(dashboards);
});

clickstackRouter.post('/dashboards', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenantId = req.tenant!.id;
  const { name, description, config, isPublic } = req.body;
  
  const dashboard = await clickhouse.query(`
    INSERT INTO clickstack_dashboards (tenant_id, name, description, config, is_public, created_by)
    VALUES ({tenant_id:String}, {name:String}, {description:String}, {config:String}, {is_public:Boolean}, {created_by:String})
  `, { 
    tenant_id: tenantId,
    name,
    description,
    config: JSON.stringify(config),
    is_public: isPublic || false,
    created_by: req.user?.id || 'system'
  });
  
  res.json({ success: true, dashboard });
});

// ClickStack Advanced Search
clickstackRouter.post('/search/advanced', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenantId = req.tenant!.id;
  const { query, timeRange, dataSources, limit = 1000 } = req.body;
  
  const results = await clickhouse.query(`
    SELECT * FROM logs 
    WHERE tenant_id = {tenant_id:String}
    AND ${buildClickStackQuery(query, dataSources)}
    AND timestamp BETWEEN {start_time:DateTime64} AND {end_time:DateTime64}
    ORDER BY timestamp DESC
    LIMIT {limit:UInt32}
  `, { 
    tenant_id: tenantId,
    start_time: timeRange.start,
    end_time: timeRange.end,
    limit
  });
  
  res.json(results);
});

// ClickStack Session Replay
clickstackRouter.get('/sessions/:sessionId', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenantId = req.tenant!.id;
  const { sessionId } = req.params;
  
  const sessionData = await clickhouse.query(`
    SELECT * FROM logs 
    WHERE tenant_id = {tenant_id:String}
    AND clickstack_metadata['session_id'] = {session_id:String}
    ORDER BY timestamp ASC
  `, { 
    tenant_id: tenantId,
    session_id: sessionId
  });
  
  res.json(sessionData);
});

// ClickStack Alerts
clickstackRouter.get('/alerts', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenantId = req.tenant!.id;
  
  const alerts = await clickhouse.query(`
    SELECT * FROM clickstack_alerts 
    WHERE tenant_id = {tenant_id:String}
    ORDER BY updated_at DESC
  `, { tenant_id: tenantId });
  
  res.json(alerts);
});

clickstackRouter.post('/alerts', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenantId = req.tenant!.id;
  const { name, description, query, condition } = req.body;
  
  const alert = await clickhouse.query(`
    INSERT INTO clickstack_alerts (tenant_id, name, description, query, condition, created_by)
    VALUES ({tenant_id:String}, {name:String}, {description:String}, {query:String}, {condition:String}, {created_by:String})
  `, { 
    tenant_id: tenantId,
    name,
    description,
    query,
    condition: JSON.stringify(condition),
    created_by: req.user?.id || 'system'
  });
  
  res.json({ success: true, alert });
});

// ClickStack Pattern Recognition
clickstackRouter.post('/patterns/discover', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenantId = req.tenant!.id;
  const { timeRange, minOccurrences = 5 } = req.body;
  
  const patterns = await clickhouse.query(`
    SELECT 
      body,
      count() as occurrences,
      avg(length(body)) as avg_length,
      min(timestamp) as first_seen,
      max(timestamp) as last_seen
    FROM logs 
    WHERE tenant_id = {tenant_id:String}
    AND timestamp BETWEEN {start_time:DateTime64} AND {end_time:DateTime64}
    GROUP BY body
    HAVING occurrences >= {min_occurrences:UInt32}
    ORDER BY occurrences DESC
    LIMIT 100
  `, { 
    tenant_id: tenantId,
    start_time: timeRange.start,
    end_time: timeRange.end,
    min_occurrences: minOccurrences
  });
  
  res.json(patterns);
});

// ClickStack Event Deltas
clickstackRouter.post('/deltas/analyze', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenantId = req.tenant!.id;
  const { metric, timeRange, baselinePeriod } = req.body;
  
  const deltas = await clickhouse.query(`
    WITH baseline AS (
      SELECT avg(value) as baseline_avg
      FROM metric_stream 
      WHERE tenant_id = {tenant_id:String}
      AND metric_name = {metric_name:String}
      AND timestamp BETWEEN {baseline_start:DateTime64} AND {baseline_end:DateTime64}
    ),
    current AS (
      SELECT timestamp, value
      FROM metric_stream 
      WHERE tenant_id = {tenant_id:String}
      AND metric_name = {metric_name:String}
      AND timestamp BETWEEN {current_start:DateTime64} AND {current_end:DateTime64}
    )
    SELECT 
      c.timestamp,
      c.value,
      b.baseline_avg,
      (c.value - b.baseline_avg) / b.baseline_avg * 100 as delta_percent
    FROM current c
    CROSS JOIN baseline b
    ORDER BY c.timestamp
  `, { 
    tenant_id: tenantId,
    metric_name: metric,
    baseline_start: baselinePeriod.start,
    baseline_end: baselinePeriod.end,
    current_start: timeRange.start,
    current_end: timeRange.end
  });
  
  res.json(deltas);
});

export default clickstackRouter;
```

### 5. Enhanced Multi-Tenant ClickStack SDK

#### Current Multi-Tenant SDK
Our existing `MultiTenantHyperDXSDK` provides:
- Tenant extraction from authentication context
- Automatic tenant tagging for all telemetry data
- Next.js specific integrations

#### ClickStack-Enhanced SDK
```typescript
// @yourorg/hyperdx-clickstack-sdk/src/index.ts
import { MultiTenantHyperDXSDK } from '@yourorg/hyperdx-sdk';

export interface ClickStackConfig {
  sessionReplayEnabled: boolean;
  patternRecognitionEnabled: boolean;
  eventDeltasEnabled: boolean;
  customFields: Record<string, string>;
}

export interface SessionReplayData {
  sessionId: string;
  userId?: string;
  pageUrl: string;
  userAgent: string;
  viewport: { width: number; height: number };
  events: Array<{
    type: string;
    timestamp: number;
    data: any;
  }>;
}

export class MultiTenantClickStackSDK extends MultiTenantHyperDXSDK {
  private clickstackConfig: ClickStackConfig;

  constructor(config: SDKConfig & ClickStackConfig) {
    super(config);
    this.clickstackConfig = config;
    this.initializeClickStackFeatures();
  }

  private initializeClickStackFeatures() {
    // Initialize ClickStack-specific features
    if (this.clickstackConfig.sessionReplayEnabled) {
      this.initializeSessionReplay();
    }
    
    if (this.clickstackConfig.patternRecognitionEnabled) {
      this.initializePatternRecognition();
    }
  }

  // ClickStack-specific logging methods
  async logWithSessionReplay(message: string, sessionData: SessionReplayData, options: LogOptions = {}) {
    const tenantId = await this.extractTenantId();
    
    const logRecord = {
      body: message,
      timestamp: Date.now() * 1000000,
      attributes: {
        tenant_id: tenantId,
        clickstack_session_id: sessionData.sessionId,
        clickstack_user_id: sessionData.userId,
        clickstack_page_url: sessionData.pageUrl,
        clickstack_user_agent: sessionData.userAgent,
        clickstack_viewport: JSON.stringify(sessionData.viewport),
        clickstack_events: JSON.stringify(sessionData.events),
        ...options.attributes
      }
    };

    this.sendLogRecord(logRecord);
  }

  async logWithPatternRecognition(message: string, pattern: string, options: LogOptions = {}) {
    const tenantId = await this.extractTenantId();
    
    const logRecord = {
      body: message,
      timestamp: Date.now() * 1000000,
      attributes: {
        tenant_id: tenantId,
        clickstack_pattern: pattern,
        clickstack_pattern_version: '1.0',
        ...options.attributes
      }
    };

    this.sendLogRecord(logRecord);
  }

  async logWithEventDelta(message: string, baseline: number, current: number, options: LogOptions = {}) {
    const tenantId = await this.extractTenantId();
    const delta = ((current - baseline) / baseline) * 100;
    
    const logRecord = {
      body: message,
      timestamp: Date.now() * 1000000,
      attributes: {
        tenant_id: tenantId,
        clickstack_baseline: baseline,
        clickstack_current: current,
        clickstack_delta_percent: delta,
        clickstack_delta_significant: Math.abs(delta) > 10,
        ...options.attributes
      }
    };

    this.sendLogRecord(logRecord);
  }

  // ClickStack Dashboard Management
  async createClickStackDashboard(dashboardConfig: any) {
    const tenantId = await this.extractTenantId();
    return this.api.post('/api/clickstack/dashboards', {
      ...dashboardConfig,
      tenant_id: tenantId
    });
  }

  async getClickStackDashboards() {
    const tenantId = await this.extractTenantId();
    return this.api.get('/api/clickstack/dashboards', {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  // ClickStack Alert Management
  async createClickStackAlert(alertConfig: any) {
    const tenantId = await this.extractTenantId();
    return this.api.post('/api/clickstack/alerts', {
      ...alertConfig,
      tenant_id: tenantId
    });
  }

  async getClickStackAlerts() {
    const tenantId = await this.extractTenantId();
    return this.api.get('/api/clickstack/alerts', {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  // ClickStack Advanced Search
  async searchClickStack(query: string, timeRange: any, dataSources: string[] = ['logs']) {
    const tenantId = await this.extractTenantId();
    return this.api.post('/api/clickstack/search/advanced', {
      query,
      timeRange,
      dataSources,
      tenant_id: tenantId
    });
  }

  // ClickStack Pattern Discovery
  async discoverPatterns(timeRange: any, minOccurrences: number = 5) {
    const tenantId = await this.extractTenantId();
    return this.api.post('/api/clickstack/patterns/discover', {
      timeRange,
      minOccurrences,
      tenant_id: tenantId
    });
  }

  // ClickStack Event Delta Analysis
  async analyzeEventDeltas(metric: string, timeRange: any, baselinePeriod: any) {
    const tenantId = await this.extractTenantId();
    return this.api.post('/api/clickstack/deltas/analyze', {
      metric,
      timeRange,
      baselinePeriod,
      tenant_id: tenantId
    });
  }

  // Next.js specific ClickStack helpers
  withClickStackNextJS() {
    return {
      middleware: this.createClickStackNextJSMiddleware.bind(this),
      apiHandler: this.createClickStackAPIHandler.bind(this),
      sessionReplay: this.createSessionReplayComponent.bind(this)
    };
  }

  private createClickStackNextJSMiddleware() {
    return async (request: NextRequest) => {
      const sessionId = this.generateSessionId();
      const sessionData = {
        sessionId,
        pageUrl: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent') || '',
        timestamp: Date.now()
      };

      await this.logWithSessionReplay('Page view', sessionData, {
        attributes: {
          path: request.nextUrl.pathname,
          method: request.method,
          referer: request.headers.get('referer')
        }
      }, request);

      return NextResponse.next();
    };
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage in Next.js app
// app/lib/clickstack.ts
import { MultiTenantClickStackSDK } from '@yourorg/hyperdx-clickstack-sdk';

export const clickstack = new MultiTenantClickStackSDK({
  serviceName: 'my-nextjs-app',
  hyperdxEndpoint: process.env.HYPERDX_ENDPOINT!,
  authServiceEndpoint: process.env.AUTH_SERVICE_ENDPOINT!,
  environment: process.env.NODE_ENV,
  // ClickStack-specific config
  sessionReplayEnabled: true,
  patternRecognitionEnabled: true,
  eventDeltasEnabled: true,
  customFields: {
    'app_version': process.env.APP_VERSION || '1.0.0',
    'deployment_env': process.env.NODE_ENV || 'development'
  }
});

// middleware.ts
import { clickstack } from '@/lib/clickstack';

export const middleware = clickstack.withClickStackNextJS().middleware;
```

### 6. ClickStack Multi-Tenant UI Components

#### Enhanced Tenant Context
```typescript
// packages/app/src/contexts/ClickStackTenantContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { fetchTenantInfo } from '@/api/tenant';

interface ClickStackTenantContextType {
  tenant: { 
    id: string; 
    name: string;
    clickstackEnabled: boolean;
    features: {
      sessionReplay: boolean;
      advancedSearch: boolean;
      customDashboards: boolean;
      alerting: boolean;
      patternRecognition: boolean;
      eventDeltas: boolean;
    };
  } | null;
  loading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  clickstackConfig: {
    defaultTimeRange: string;
    maxQueryTime: number;
    allowedDataSources: string[];
    ui: {
      theme: 'light' | 'dark';
      customBranding?: any;
    };
  };
}

const ClickStackTenantContext = createContext<ClickStackTenantContextType | null>(null);

export const ClickStackTenantProvider = ({ children }: { children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<ClickStackTenantContextType['tenant']>(null);
  const [loading, setLoading] = useState(true);
  const [clickstackConfig, setClickstackConfig] = useState({
    defaultTimeRange: '1h',
    maxQueryTime: 30000,
    allowedDataSources: ['logs', 'traces', 'metrics', 'sessions'],
    ui: {
      theme: 'light' as const,
      customBranding: undefined
    }
  });

  useEffect(() => {
    fetchTenantInfo().then(tenantInfo => {
      setTenant(tenantInfo);
      if (tenantInfo?.clickstack) {
        setClickstackConfig({
          defaultTimeRange: tenantInfo.clickstack.ui?.defaultTimeRange || '1h',
          maxQueryTime: tenantInfo.clickstack.limits?.maxQueryTime || 30000,
          allowedDataSources: ['logs', 'traces', 'metrics', 'sessions'],
          ui: {
            theme: tenantInfo.clickstack.ui?.theme || 'light',
            customBranding: tenantInfo.clickstack.ui?.customBranding
          }
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const switchTenant = async (tenantId: string) => {
    setLoading(true);
    const newTenant = await fetchTenantInfo(tenantId);
    setTenant(newTenant);
    setLoading(false);
  };

  return (
    <ClickStackTenantContext.Provider value={{ tenant, loading, switchTenant, clickstackConfig }}>
      {children}
    </ClickStackTenantContext.Provider>
  );
};

export const useClickStackTenant = () => {
  const context = useContext(ClickStackTenantContext);
  if (!context) throw new Error('useClickStackTenant must be used within ClickStackTenantProvider');
  return context;
};
```

#### ClickStack Dashboard Components
```typescript
// packages/app/src/components/ClickStackDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useClickStackTenant } from '@/contexts/ClickStackTenantContext';
import { api } from '@/api';

interface ClickStackDashboardProps {
  dashboardId?: string;
  defaultConfig?: any;
}

export const ClickStackDashboard: React.FC<ClickStackDashboardProps> = ({ 
  dashboardId, 
  defaultConfig 
}) => {
  const { tenant, clickstackConfig } = useClickStackTenant();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dashboardId && tenant?.clickstackEnabled) {
      api.get(`/api/clickstack/dashboards/${dashboardId}`)
        .then(response => setDashboard(response.data))
        .finally(() => setLoading(false));
    } else if (defaultConfig) {
      setDashboard(defaultConfig);
      setLoading(false);
    }
  }, [dashboardId, tenant, defaultConfig]);

  if (!tenant?.clickstackEnabled) {
    return <div>ClickStack is not enabled for this tenant</div>;
  }

  if (loading) {
    return <div>Loading ClickStack dashboard...</div>;
  }

  return (
    <div className={`clickstack-dashboard theme-${clickstackConfig.ui.theme}`}>
      {dashboard?.config?.panels?.map((panel: any, index: number) => (
        <ClickStackPanel key={index} panel={panel} />
      ))}
    </div>
  );
};

const ClickStackPanel: React.FC<{ panel: any }> = ({ panel }) => {
  const { clickstackConfig } = useClickStackTenant();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (panel.query) {
      api.post('/api/clickstack/search/advanced', {
        query: panel.query,
        timeRange: { start: Date.now() - 3600000, end: Date.now() },
        dataSources: clickstackConfig.allowedDataSources
      }).then(response => setData(response.data));
    }
  }, [panel.query, clickstackConfig]);

  return (
    <div className="clickstack-panel">
      <h3>{panel.title}</h3>
      <div className="panel-content">
        {panel.type === 'chart' && <ClickStackChart data={data} config={panel.config} />}
        {panel.type === 'table' && <ClickStackTable data={data} config={panel.config} />}
        {panel.type === 'metric' && <ClickStackMetric data={data} config={panel.config} />}
      </div>
    </div>
  );
};
```

### 7. ClickStack Monitoring and Observability

#### Tenant Usage Tracking
```typescript
// packages/api/src/utils/clickstackMonitoring.ts
import { hyperdx } from '@/lib/hyperdx';

export const clickstackMonitoring = {
  trackTenantUsage: (tenantId: string, feature: string, usage: any) => {
    hyperdx.log('ClickStack tenant usage', {
      level: 'INFO',
      attributes: {
        tenant_id: tenantId,
        clickstack_feature: feature,
        usage_metrics: usage,
        monitoring: true
      }
    });
  },

  trackClickStackPerformance: (tenantId: string, queryType: string, duration: number) => {
    hyperdx.log('ClickStack query performance', {
      level: 'INFO',
      attributes: {
        tenant_id: tenantId,
        clickstack_query_type: queryType,
        query_duration_ms: duration,
        performance_monitoring: true
      }
    });
  },

  trackClickStackError: (tenantId: string, error: string, context: any) => {
    hyperdx.log('ClickStack error', {
      level: 'ERROR',
      attributes: {
        tenant_id: tenantId,
        clickstack_error: error,
        error_context: context,
        error_monitoring: true
      }
    });
  },

  trackClickStackFeatureAccess: (tenantId: string, feature: string, allowed: boolean) => {
    hyperdx.log('ClickStack feature access', {
      level: 'INFO',
      attributes: {
        tenant_id: tenantId,
        clickstack_feature: feature,
        access_allowed: allowed,
        access_monitoring: true
      }
    });
  }
};
```

#### ClickStack Health Checks
```typescript
// packages/api/src/utils/clickstackHealth.ts
import { clickhouse } from '@/clickhouse';

export const clickstackHealth = {
  checkTenantDataHealth: async (tenantId: string) => {
    try {
      const result = await clickhouse.query(`
        SELECT 
          count() as total_logs,
          count(DISTINCT ServiceName) as unique_services,
          min(timestamp) as earliest_log,
          max(timestamp) as latest_log,
          avg(length(body)) as avg_log_size
        FROM logs 
        WHERE tenant_id = {tenant_id:String}
        AND timestamp >= now() - INTERVAL 24 HOUR
      `, { tenant_id: tenantId });

      return {
        healthy: true,
        metrics: result[0],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  checkClickStackFeatures: async (tenantId: string) => {
    const features = ['sessionReplay', 'advancedSearch', 'customDashboards', 'alerting'];
    const results = {};

    for (const feature of features) {
      try {
        const result = await clickhouse.query(`
          SELECT count() as usage_count
          FROM logs 
          WHERE tenant_id = {tenant_id:String}
          AND attributes['clickstack_feature'] = {feature:String}
          AND timestamp >= now() - INTERVAL 1 HOUR
        `, { tenant_id: tenantId, feature });

        results[feature] = {
          enabled: true,
          usage: result[0]?.usage_count || 0
        };
      } catch (error) {
        results[feature] = {
          enabled: false,
          error: error.message
        };
      }
    }

    return results;
  }
};
```

### 8. ClickStack Feature Flags and Limits

#### Feature Flag System
```typescript
// packages/api/src/utils/clickstackFeatureFlags.ts
import { getTenantConfig } from '@/models/team';

export class ClickStackFeatureFlags {
  static isFeatureEnabled(tenantId: string, feature: string): boolean {
    const tenant = getTenantConfig(tenantId);
    return tenant.clickstack?.features?.[feature] ?? false;
  }

  static getTenantLimits(tenantId: string): any {
    const tenant = getTenantConfig(tenantId);
    return tenant.clickstack?.limits ?? {
      maxDashboards: 10,
      maxAlerts: 50,
      dataRetentionDays: 30,
      maxQueryTime: 30000,
      maxSessionsPerDay: 1000,
      maxCustomFields: 20
    };
  }

  static checkLimit(tenantId: string, limitType: string, currentValue: number): boolean {
    const limits = this.getTenantLimits(tenantId);
    const limit = limits[limitType];
    return currentValue < limit;
  }

  static getTenantUI(tenantId: string): any {
    const tenant = getTenantConfig(tenantId);
    return tenant.clickstack?.ui ?? {
      defaultTimeRange: '1h',
      theme: 'light'
    };
  }
}
```

### 9. ClickStack Migration Strategy

#### Database Migration Scripts
```sql
-- Migration script for existing multi-tenant data to ClickStack
-- Add ClickStack-specific columns to existing tables
ALTER TABLE default.logs ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));
ALTER TABLE default.traces ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));
ALTER TABLE default.metric_stream ADD COLUMN IF NOT EXISTS clickstack_metadata Map(String, String) DEFAULT map() CODEC(ZSTD(1));

-- Backfill existing data with ClickStack defaults
UPDATE default.logs SET clickstack_metadata = map('version', '1.0', 'migrated', 'true') WHERE clickstack_metadata = map();
UPDATE default.traces SET clickstack_metadata = map('version', '1.0', 'migrated', 'true') WHERE clickstack_metadata = map();
UPDATE default.metric_stream SET clickstack_metadata = map('version', '1.0', 'migrated', 'true') WHERE clickstack_metadata = map();

-- Create ClickStack-specific tables
CREATE TABLE IF NOT EXISTS clickstack_dashboards (
    id UUID DEFAULT generateUUIDv4(),
    tenant_id String,
    name String,
    description String,
    config String,
    created_at DateTime64(3) DEFAULT now(),
    updated_at DateTime64(3) DEFAULT now(),
    created_by String,
    is_public Boolean DEFAULT false
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at)
PARTITION BY tenant_id;

CREATE TABLE IF NOT EXISTS clickstack_alerts (
    id UUID DEFAULT generateUUIDv4(),
    tenant_id String,
    name String,
    description String,
    query String,
    condition String,
    status String DEFAULT 'active',
    created_at DateTime64(3) DEFAULT now(),
    updated_at DateTime64(3) DEFAULT now(),
    created_by String
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at)
PARTITION BY tenant_id;

-- Create ClickStack indexes
CREATE INDEX IF NOT EXISTS idx_clickstack_tenant_timestamp ON default.logs (tenant_id, timestamp) TYPE minmax GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_clickstack_tenant_service ON default.logs (tenant_id, ServiceName) TYPE bloom_filter(0.01) GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_clickstack_tenant_session ON default.logs (tenant_id, clickstack_metadata['session_id']) TYPE bloom_filter(0.01) GRANULARITY 1;
```

#### Application Migration Scripts
```typescript
// packages/api/scripts/migrateToClickStack.ts
import { Team } from '@/models/team';
import { clickhouse } from '@/clickhouse';

export async function migrateToClickStack() {
  console.log('Starting ClickStack migration...');

  // Update all existing teams with ClickStack defaults
  const teams = await Team.find({});
  
  for (const team of teams) {
    console.log(`Migrating team: ${team.name}`);
    
    // Add ClickStack configuration if not present
    if (!team.clickstack) {
      team.clickstack = {
        enabled: true,
        features: {
          sessionReplay: true,
          advancedSearch: true,
          customDashboards: true,
          alerting: true,
          patternRecognition: true,
          eventDeltas: true
        },
        limits: {
          maxDashboards: 10,
          maxAlerts: 50,
          dataRetentionDays: 30,
          maxQueryTime: 30000,
          maxSessionsPerDay: 1000,
          maxCustomFields: 20
        },
        ui: {
          defaultTimeRange: '1h',
          theme: 'light'
        },
        integrations: {
          openTelemetry: true,
          vector: false,
          fluentd: false,
          customCollectors: []
        }
      };
      
      await team.save();
      console.log(`Updated team ${team.name} with ClickStack config`);
    }
  }

  console.log('ClickStack migration completed');
}
```

### 10. Implementation Phases

#### Phase 1: Core Infrastructure (Weeks 1-2)
1. **Enhanced OTEL Collector Configuration**
   - Update `otel-collector-multi-tenant.yaml` with ClickStack schema
   - Add ClickStack-specific processors and filters
   - Test tenant extraction with ClickStack metadata

2. **Database Schema Extensions**
   - Add ClickStack metadata columns to existing tables
   - Create ClickStack-specific tables (dashboards, alerts)
   - Add optimized indexes for ClickStack queries

#### Phase 2: API Layer (Weeks 3-4)
3. **ClickStack API Endpoints**
   - Implement dashboard management endpoints
   - Add advanced search functionality
   - Create alert management system
   - Add pattern recognition and event delta analysis

4. **Enhanced Team Model**
   - Extend Team model with ClickStack configuration
   - Add feature flags and limits
   - Implement tenant-specific UI customization

#### Phase 3: SDK and Frontend (Weeks 5-6)
5. **Enhanced Multi-Tenant SDK**
   - Extend existing SDK with ClickStack features
   - Add session replay capabilities
   - Implement pattern recognition and event deltas
   - Create Next.js specific integrations

6. **ClickStack UI Components**
   - Build ClickStack dashboard components
   - Add tenant-aware context providers
   - Implement feature flag checking
   - Create custom branding support

#### Phase 4: Monitoring and Testing (Weeks 7-8)
7. **ClickStack Monitoring**
   - Implement tenant usage tracking
   - Add performance monitoring
   - Create health check endpoints
   - Build alerting for ClickStack issues

8. **Testing and Validation**
   - End-to-end tenant isolation testing
   - Performance benchmarking
   - Security audit
   - Feature flag validation

#### Phase 5: Migration and Documentation (Weeks 9-10)
9. **Migration Strategy**
   - Create database migration scripts
   - Build application migration tools
   - Test migration with existing data
   - Create rollback procedures

10. **Documentation and Training**
    - Update API documentation
    - Create ClickStack user guides
    - Build training materials
    - Document best practices

## Performance Considerations

### ClickHouse Optimization
- **ClickStack Indexes**: Optimized indexes for tenant_id + ClickStack metadata
- **Query Performance**: Ensure ClickStack queries leverage tenant filtering
- **Resource Allocation**: Monitor per-tenant ClickStack resource usage

### Scaling Strategy
```yaml
# Kubernetes deployment with ClickStack tenant affinity
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hyperdx-clickstack-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        env:
        - name: CLICKSTACK_ENABLED
          value: "true"
        - name: TENANT_AWARE_MODE
          value: "true"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi" 
            cpu: "1000m"
```

## Security Architecture

### Data Isolation Guarantees
1. **Query Level**: All ClickStack queries automatically filtered by tenant_id
2. **Ingestion Level**: ClickStack metadata tagged with tenant context
3. **API Level**: Authentication required for all ClickStack endpoints
4. **UI Level**: Tenant context validated on every ClickStack operation

### Audit Trail
```typescript
// Audit logging for ClickStack operations
export const clickstackAuditLog = {
  tenantAccess: (tenantId: string, userId: string, action: string, resource: string) => {
    hyperdx.log('ClickStack tenant access', {
      level: 'INFO',
      attributes: {
        tenant_id: tenantId,
        user_id: userId,
        action,
        resource,
        clickstack_audit: true
      }
    });
  }
};
```

## Cost & Resource Planning

### Resource Requirements
- **Additional Storage**: ~10-15% overhead for ClickStack metadata columns
- **Query Performance**: <10% performance impact with proper indexing
- **Memory**: Additional 200-400MB per API instance for ClickStack features

### Operational Complexity
- **Deployment**: Enhanced with ClickStack-aware configurations
- **Monitoring**: Per-tenant ClickStack metrics and alerting required  
- **Backup**: ClickStack-aware backup/restore procedures

## Success Metrics

### Technical Metrics
- **Query Performance**: <10% degradation with ClickStack features
- **Data Isolation**: 100% tenant data separation validated
- **API Response Time**: <20ms additional latency for ClickStack operations

### Business Metrics  
- **Feature Adoption**: >80% of tenants enable ClickStack features
- **Developer Experience**: Simplified ClickStack integration
- **Operational Overhead**: <30% increase in maintenance effort

## Conclusion

This ClickStack multi-tenant integration design transforms our existing HyperDX platform into a comprehensive observability solution that maintains the performance, security, and scalability of our multi-tenant architecture while adding powerful ClickStack features.

**Recommended Decision**: Proceed with Phase 1 implementation, building the core ClickStack infrastructure before expanding to advanced features. This approach provides solid foundation for ClickStack integration while allowing for iterative improvements based on real-world usage patterns.

---

*Total Implementation Effort: 10-12 weeks*  
*Team Size Required: 3-4 senior developers*  
*Risk Level: Medium (well-defined approach with clear rollback strategy)*
