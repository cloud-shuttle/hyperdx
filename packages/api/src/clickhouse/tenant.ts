import { 
  BaseResultSet,
  ResponseJSON,
  SettingsMap 
} from '@clickhouse/client';
import opentelemetry from '@opentelemetry/api';
import SqlString from 'sqlstring';

import { logger } from '@/utils/logger';
import { createClient } from './index'; // Import existing ClickHouse client setup

const tracer = opentelemetry.trace.getTracer(__filename);

// SQL injection prevention patterns
const DANGEROUS_PATTERNS = [
  /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|TRUNCATE)\s+/i,
  /--/,
  /\/\*/,
  /\*\//,
  /union\s+select/i,
  /exec\s*\(/i
];

// Table patterns that should be tenant-filtered
const TENANT_FILTERED_TABLES = [
  'logs',
  'traces', 
  'metric_stream',
  'default.logs',
  'default.traces',
  'default.metric_stream'
];

export class TenantAwareClickHouse {
  private tenantId: string;
  private client: any; // Use the existing ClickHouse client
  private isValidated: boolean = false;

  constructor(tenantId: string) {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Valid tenant ID required for ClickHouse client');
    }
    
    this.tenantId = tenantId;
    this.client = createClient(); // Use existing client setup
    this.validateTenantId();
  }

  private validateTenantId(): void {
    // Validate tenant ID to prevent injection
    if (DANGEROUS_PATTERNS.some(pattern => pattern.test(this.tenantId))) {
      throw new Error('Invalid tenant ID contains dangerous characters');
    }
    
    if (this.tenantId.length > 64) {
      throw new Error('Tenant ID too long');
    }
    
    this.isValidated = true;
  }

  /**
   * Inject tenant filter into SQL query
   */
  private injectTenantFilter(sql: string): string {
    if (!this.isValidated) {
      throw new Error('Tenant ID not validated');
    }

    // Check for dangerous patterns in SQL
    if (DANGEROUS_PATTERNS.some(pattern => pattern.test(sql))) {
      logger.error('Dangerous SQL pattern detected', { 
        tenantId: this.tenantId,
        sql: sql.substring(0, 100) + '...'
      });
      throw new Error('SQL query contains dangerous patterns');
    }

    let modifiedSql = sql;
    
    // Find table references and add tenant filtering
    TENANT_FILTERED_TABLES.forEach(table => {
      const tableRegex = new RegExp(`\\b${table}\\b`, 'gi');
      
      if (tableRegex.test(modifiedSql)) {
        // Add tenant filter to WHERE clause
        if (modifiedSql.toLowerCase().includes('where')) {
          // Replace first WHERE with tenant filter
          modifiedSql = modifiedSql.replace(
            /\bwhere\b/i,
            `WHERE tenant_id = {tenant_id:String} AND`
          );
        } else {
          // Find FROM clause and add WHERE
          const fromMatch = modifiedSql.match(new RegExp(`FROM\\s+${table}`, 'i'));
          if (fromMatch) {
            const insertIndex = fromMatch.index! + fromMatch[0].length;
            modifiedSql = 
              modifiedSql.slice(0, insertIndex) + 
              ` WHERE tenant_id = {tenant_id:String}` +
              modifiedSql.slice(insertIndex);
          }
        }
      }
    });

    return modifiedSql;
  }

  /**
   * Execute query with automatic tenant filtering
   */
  async query(options: {
    query: string;
    query_params?: Record<string, any>;
    format?: string;
    clickhouse_settings?: SettingsMap;
  }): Promise<BaseResultSet> {
    return tracer.startActiveSpan('clickhouse.tenant.query', async (span) => {
      try {
        const { query: originalQuery, query_params = {}, ...otherOptions } = options;
        
        // Inject tenant filter
        const filteredQuery = this.injectTenantFilter(originalQuery);
        
        // Add tenant_id to query parameters
        const tenantParams = {
          ...query_params,
          tenant_id: this.tenantId
        };

        span.setAttributes({
          'tenant.id': this.tenantId,
          'query.original_length': originalQuery.length,
          'query.filtered_length': filteredQuery.length,
          'query.has_params': Object.keys(tenantParams).length > 0
        });

        logger.debug('Executing tenant-filtered query', {
          tenantId: this.tenantId,
          originalQueryPrefix: originalQuery.substring(0, 50) + '...',
          filteredQueryPrefix: filteredQuery.substring(0, 50) + '...',
          paramsCount: Object.keys(tenantParams).length
        });

        const result = await this.client.query({
          query: filteredQuery,
          query_params: tenantParams,
          ...otherOptions
        });

        span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
        return result;
        
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message
        });
        
        logger.error('Tenant-filtered query failed', {
          tenantId: this.tenantId,
          error: error.message,
          queryPrefix: options.query.substring(0, 100) + '...'
        });
        
        throw error;
      }
    });
  }

  /**
   * Insert data with automatic tenant tagging
   */
  async insert(options: {
    table: string;
    values: any[];
    format?: string;
    clickhouse_settings?: SettingsMap;
  }): Promise<BaseResultSet> {
    return tracer.startActiveSpan('clickhouse.tenant.insert', async (span) => {
      try {
        const { table, values, ...otherOptions } = options;
        
        // Validate table is tenant-filtered
        if (!TENANT_FILTERED_TABLES.includes(table) && !TENANT_FILTERED_TABLES.includes(`default.${table}`)) {
          logger.warn('Attempting to insert into non-tenant table', {
            tenantId: this.tenantId,
            table
          });
        }

        // Tag all values with tenant_id
        const taggedValues = values.map(value => ({
          ...value,
          tenant_id: this.tenantId
        }));

        span.setAttributes({
          'tenant.id': this.tenantId,
          'table': table,
          'rows_count': taggedValues.length
        });

        logger.debug('Inserting tenant-tagged data', {
          tenantId: this.tenantId,
          table,
          rowCount: taggedValues.length
        });

        const result = await this.client.insert({
          table,
          values: taggedValues,
          ...otherOptions
        });

        span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
        return result;
        
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message
        });
        
        logger.error('Tenant-tagged insert failed', {
          tenantId: this.tenantId,
          table: options.table,
          error: error.message
        });
        
        throw error;
      }
    });
  }

  /**
   * Execute a command (non-SELECT query) with tenant context
   */
  async command(options: {
    query: string;
    query_params?: Record<string, any>;
    clickhouse_settings?: SettingsMap;
  }): Promise<BaseResultSet> {
    return tracer.startActiveSpan('clickhouse.tenant.command', async (span) => {
      try {
        const { query: originalQuery, query_params = {}, ...otherOptions } = options;
        
        // For non-SELECT commands, still validate for safety
        if (DANGEROUS_PATTERNS.some(pattern => pattern.test(originalQuery))) {
          throw new Error('Command contains dangerous patterns');
        }

        const tenantParams = {
          ...query_params,
          tenant_id: this.tenantId
        };

        span.setAttributes({
          'tenant.id': this.tenantId,
          'command.type': 'non_select'
        });

        logger.debug('Executing tenant command', {
          tenantId: this.tenantId,
          queryPrefix: originalQuery.substring(0, 50) + '...'
        });

        const result = await this.client.command({
          query: originalQuery,
          query_params: tenantParams,
          ...otherOptions
        });

        span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
        return result;
        
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message
        });
        
        logger.error('Tenant command failed', {
          tenantId: this.tenantId,
          error: error.message
        });
        
        throw error;
      }
    });
  }

  /**
   * Get tenant ID for this client
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Close the underlying ClickHouse connection
   */
  async close(): Promise<void> {
    await this.client.close();
  }

  /**
   * Ping ClickHouse to check connection
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('ClickHouse ping failed for tenant', {
        tenantId: this.tenantId,
        error: error.message
      });
      return false;
    }
  }
}

/**
 * Factory function to create tenant-aware ClickHouse client
 */
export const createTenantClickHouseClient = (tenantId: string): TenantAwareClickHouse => {
  return new TenantAwareClickHouse(tenantId);
};

/**
 * Utility function to validate if a query is tenant-safe
 */
export const validateTenantSafeQuery = (query: string): boolean => {
  // Check for dangerous patterns
  if (DANGEROUS_PATTERNS.some(pattern => pattern.test(query))) {
    return false;
  }
  
  // Check if query references tenant-filtered tables
  const referencesTenantTables = TENANT_FILTERED_TABLES.some(table => 
    new RegExp(`\\b${table}\\b`, 'i').test(query)
  );
  
  if (referencesTenantTables) {
    // Must include tenant_id filter
    return /tenant_id\s*=/.test(query);
  }
  
  return true;
};