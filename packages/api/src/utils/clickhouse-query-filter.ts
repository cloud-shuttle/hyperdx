import { logger } from '@/utils/logger';
import { TenantRequest } from '@/middleware/tenant';
import { getTenantId } from '@/utils/tenant';
import { createTenantClickHouseClient, TenantAwareClickHouse } from '@/clickhouse/tenant';

// Query filtering utilities for tenant isolation

/**
 * Create a tenant-scoped ClickHouse client from request context
 */
export const createTenantClient = (req: TenantRequest): TenantAwareClickHouse => {
  const tenantId = getTenantId(req);
  return createTenantClickHouseClient(tenantId);
};

/**
 * Execute a tenant-filtered query with automatic client creation
 */
export const executeTenantsQuery = async (
  req: TenantRequest,
  queryOptions: {
    query: string;
    query_params?: Record<string, any>;
    format?: string;
  }
) => {
  const tenantClient = createTenantClient(req);
  
  try {
    return await tenantClient.query(queryOptions);
  } finally {
    await tenantClient.close();
  }
};

/**
 * Insert tenant-tagged data with automatic client creation
 */
export const insertTenantData = async (
  req: TenantRequest,
  insertOptions: {
    table: string;
    values: any[];
    format?: string;
  }
) => {
  const tenantClient = createTenantClient(req);
  
  try {
    return await tenantClient.insert(insertOptions);
  } finally {
    await tenantClient.close();
  }
};

/**
 * Common query builders with tenant filtering
 */
export class TenantQueryBuilder {
  private tenantId: string;

  constructor(req: TenantRequest) {
    this.tenantId = getTenantId(req);
  }

  /**
   * Build logs query with tenant filtering
   */
  buildLogsQuery(options: {
    timeRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }) {
    const {
      timeRange,
      filters = {},
      limit = 1000,
      orderBy = 'timestamp',
      orderDirection = 'DESC'
    } = options;

    let whereConditions = ['tenant_id = {tenant_id:String}'];
    const params: Record<string, any> = { tenant_id: this.tenantId };

    // Add time range filter
    if (timeRange) {
      whereConditions.push('timestamp >= {start_time:DateTime}');
      whereConditions.push('timestamp <= {end_time:DateTime}');
      params.start_time = timeRange.start.toISOString();
      params.end_time = timeRange.end.toISOString();
    }

    // Add custom filters
    Object.entries(filters).forEach(([key, value], index) => {
      const paramKey = `filter_${index}`;
      
      if (Array.isArray(value)) {
        whereConditions.push(`${key} IN {${paramKey}:Array(String)}`);
        params[paramKey] = value;
      } else {
        whereConditions.push(`${key} = {${paramKey}:String}`);
        params[paramKey] = String(value);
      }
    });

    const query = `
      SELECT *
      FROM default.logs
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT {limit:UInt32}
    `;

    params.limit = limit;

    return { query: query.trim(), query_params: params };
  }

  /**
   * Build traces query with tenant filtering
   */
  buildTracesQuery(options: {
    traceId?: string;
    spanId?: string;
    serviceName?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  }) {
    const {
      traceId,
      spanId, 
      serviceName,
      timeRange,
      limit = 1000
    } = options;

    let whereConditions = ['tenant_id = {tenant_id:String}'];
    const params: Record<string, any> = { tenant_id: this.tenantId };

    if (traceId) {
      whereConditions.push('trace_id = {trace_id:String}');
      params.trace_id = traceId;
    }

    if (spanId) {
      whereConditions.push('span_id = {span_id:String}');
      params.span_id = spanId;
    }

    if (serviceName) {
      whereConditions.push('service_name = {service_name:String}');
      params.service_name = serviceName;
    }

    if (timeRange) {
      whereConditions.push('timestamp >= {start_time:DateTime}');
      whereConditions.push('timestamp <= {end_time:DateTime}');
      params.start_time = timeRange.start.toISOString();
      params.end_time = timeRange.end.toISOString();
    }

    const query = `
      SELECT *
      FROM default.traces
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32}
    `;

    params.limit = limit;

    return { query: query.trim(), query_params: params };
  }

  /**
   * Build metrics query with tenant filtering
   */
  buildMetricsQuery(options: {
    metricName?: string;
    timeRange?: { start: Date; end: Date };
    groupBy?: string[];
    aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count';
    limit?: number;
  }) {
    const {
      metricName,
      timeRange,
      groupBy = [],
      aggregation = 'avg',
      limit = 1000
    } = options;

    let whereConditions = ['tenant_id = {tenant_id:String}'];
    const params: Record<string, any> = { tenant_id: this.tenantId };

    if (metricName) {
      whereConditions.push('metric_name = {metric_name:String}');
      params.metric_name = metricName;
    }

    if (timeRange) {
      whereConditions.push('timestamp >= {start_time:DateTime}');
      whereConditions.push('timestamp <= {end_time:DateTime}');
      params.start_time = timeRange.start.toISOString();
      params.end_time = timeRange.end.toISOString();
    }

    const groupByClause = groupBy.length > 0 ? `GROUP BY ${groupBy.join(', ')}` : '';
    const selectFields = groupBy.length > 0 
      ? `${groupBy.join(', ')}, ${aggregation}(value) as value`
      : `${aggregation}(value) as value`;

    const query = `
      SELECT ${selectFields}
      FROM default.metric_stream
      WHERE ${whereConditions.join(' AND ')}
      ${groupByClause}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32}
    `;

    params.limit = limit;

    return { query: query.trim(), query_params: params };
  }

  /**
   * Build aggregation query for dashboards
   */
  buildAggregationQuery(options: {
    table: 'logs' | 'traces' | 'metric_stream';
    timeRange: { start: Date; end: Date };
    groupBy?: string[];
    filters?: Record<string, any>;
    aggregations?: Array<{
      field: string;
      function: 'count' | 'sum' | 'avg' | 'max' | 'min';
      alias?: string;
    }>;
    limit?: number;
  }) {
    const {
      table,
      timeRange,
      groupBy = [],
      filters = {},
      aggregations = [{ field: '*', function: 'count', alias: 'count' }],
      limit = 1000
    } = options;

    let whereConditions = ['tenant_id = {tenant_id:String}'];
    const params: Record<string, any> = { tenant_id: this.tenantId };

    // Time range
    whereConditions.push('timestamp >= {start_time:DateTime}');
    whereConditions.push('timestamp <= {end_time:DateTime}');
    params.start_time = timeRange.start.toISOString();
    params.end_time = timeRange.end.toISOString();

    // Custom filters
    Object.entries(filters).forEach(([key, value], index) => {
      const paramKey = `filter_${index}`;
      whereConditions.push(`${key} = {${paramKey}:String}`);
      params[paramKey] = String(value);
    });

    // Build aggregation fields
    const aggFields = aggregations.map(agg => {
      const alias = agg.alias || `${agg.function}_${agg.field}`;
      return `${agg.function}(${agg.field}) as ${alias}`;
    });

    const selectFields = [...groupBy, ...aggFields].join(', ');
    const groupByClause = groupBy.length > 0 ? `GROUP BY ${groupBy.join(', ')}` : '';

    const query = `
      SELECT ${selectFields}
      FROM default.${table}
      WHERE ${whereConditions.join(' AND ')}
      ${groupByClause}
      ORDER BY ${groupBy[0] || 'count'} DESC
      LIMIT {limit:UInt32}
    `;

    params.limit = limit;

    return { query: query.trim(), query_params: params };
  }
}

/**
 * Helper function to execute query with automatic tenant context
 */
export const withTenantQuery = async <T>(
  req: TenantRequest,
  queryFn: (client: TenantAwareClickHouse) => Promise<T>
): Promise<T> => {
  const tenantClient = createTenantClient(req);
  
  try {
    return await queryFn(tenantClient);
  } finally {
    await tenantClient.close();
  }
};

/**
 * Validate and sanitize query parameters
 */
export const sanitizeQueryParams = (params: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    // Validate key format
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      logger.warn('Invalid parameter key format', { key });
      return;
    }
    
    // Sanitize value based on type
    if (typeof value === 'string') {
      // Remove dangerous characters
      sanitized[key] = value.replace(/[<>'"\\]/g, '');
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => 
        typeof v === 'string' ? v.replace(/[<>'"\\]/g, '') : v
      );
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};