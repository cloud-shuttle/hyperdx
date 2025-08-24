import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { diag, DiagConsoleLogger, DiagLogLevel, trace } from '@opentelemetry/api';

export interface SDKConfig {
  serviceName: string;
  hyperdxEndpoint: string;
  authServiceEndpoint?: string;
  environment?: string;
  debug?: boolean;
  enableTracing?: boolean;
  enableLogs?: boolean;
}

export interface LogOptions {
  level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  attributes?: Record<string, any>;
  tenantId?: string;
  timestamp?: Date;
}

export interface MetricOptions {
  attributes?: Record<string, any>;
  tenantId?: string;
  timestamp?: Date;
}

export interface TraceOptions {
  tenantId?: string;
  attributes?: Record<string, any>;
}

/**
 * Multi-tenant HyperDX SDK for observability
 */
export class MultiTenantHyperDXSDK {
  private sdk: NodeSDK | null = null;
  private config: SDKConfig;
  private isInitialized = false;
  private defaultTenantId = 'default';

  constructor(config: SDKConfig) {
    this.config = {
      enableTracing: true,
      enableLogs: true,
      debug: false,
      ...config
    };

    if (this.config.debug) {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }
  }

  /**
   * Initialize the SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment || 'production',
        [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'hyperdx-multi-tenant'
      });

      const sdkConfig: any = {
        resource
      };

      // Configure tracing
      if (this.config.enableTracing) {
        sdkConfig.traceExporter = new OTLPTraceExporter({
          url: `${this.config.hyperdxEndpoint}/v1/traces`,
          headers: {
            'User-Agent': '@hyperdx/multi-tenant-sdk/1.0.0'
          }
        });
      }

      // Configure logging
      if (this.config.enableLogs) {
        sdkConfig.logRecordProcessor = new BatchLogRecordProcessor(
          new OTLPLogExporter({
            url: `${this.config.hyperdxEndpoint}/v1/logs`,
            headers: {
              'User-Agent': '@hyperdx/multi-tenant-sdk/1.0.0'
            }
          })
        );
      }

      this.sdk = new NodeSDK(sdkConfig);
      this.sdk.start();
      this.isInitialized = true;

      console.log(`[HyperDX SDK] Initialized for service: ${this.config.serviceName}`);
      
    } catch (error) {
      console.error('[HyperDX SDK] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Extract tenant ID from request or context
   */
  async extractTenantId(request?: any): Promise<string> {
    // Try to extract from Next.js request
    if (request?.headers?.authorization && this.config.authServiceEndpoint) {
      try {
        const response = await fetch(`${this.config.authServiceEndpoint}/validate`, {
          method: 'POST',
          headers: {
            'Authorization': request.headers.authorization,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (response.ok) {
          const auth = await response.json();
          return auth.tenant_id || this.defaultTenantId;
        }
      } catch (error) {
        console.warn('[HyperDX SDK] Failed to extract tenant from auth service:', error.message);
      }
    }

    // Try to extract from custom header
    if (request?.headers?.['x-tenant-id']) {
      return request.headers['x-tenant-id'];
    }

    // Try to extract from Next.js cookies or session
    if (request?.cookies?.tenant_id) {
      return request.cookies.tenant_id;
    }

    // Fallback to environment variable
    if (process.env.HYPERDX_TENANT_ID) {
      return process.env.HYPERDX_TENANT_ID;
    }

    return this.defaultTenantId;
  }

  /**
   * Log a message with tenant context
   */
  async log(message: string, options: LogOptions = {}, request?: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tenantId = options.tenantId || await this.extractTenantId(request);
      
      const logRecord = {
        body: message,
        timestamp: (options.timestamp || new Date()).getTime() * 1000000, // Convert to nanoseconds
        attributes: {
          tenant_id: tenantId,
          level: options.level || 'INFO',
          service_name: this.config.serviceName,
          environment: this.config.environment || 'production',
          ...options.attributes
        }
      };

      // In a real implementation, you would use the OTEL Logs API
      // For now, we'll use console with structured output that OTEL can capture
      const structuredLog = {
        timestamp: new Date().toISOString(),
        level: options.level || 'INFO',
        message,
        tenant_id: tenantId,
        service: this.config.serviceName,
        ...options.attributes
      };

      console.log(JSON.stringify(structuredLog));

      if (this.config.debug) {
        console.debug('[HyperDX SDK] Log sent:', structuredLog);
      }

    } catch (error) {
      console.error('[HyperDX SDK] Failed to send log:', error);
    }
  }

  /**
   * Create a traced span with tenant context
   */
  async trace<T>(
    name: string,
    fn: (span: any) => Promise<T> | T,
    options: TraceOptions = {},
    request?: any
  ): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const tracer = trace.getTracer(this.config.serviceName);
    const tenantId = options.tenantId || await this.extractTenantId(request);

    return tracer.startActiveSpan(name, {
      attributes: {
        tenant_id: tenantId,
        service_name: this.config.serviceName,
        ...options.attributes
      }
    }, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: 1 }); // OK
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ 
          code: 2, // ERROR
          message: error.message 
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Record a custom metric with tenant context
   */
  async metric(
    name: string, 
    value: number, 
    options: MetricOptions = {},
    request?: any
  ): Promise<void> {
    const tenantId = options.tenantId || await this.extractTenantId(request);

    // Log metric as structured log for now
    // In a full implementation, you'd use OTEL Metrics API
    await this.log(`metric:${name}`, {
      level: 'INFO',
      attributes: {
        metric_name: name,
        metric_value: value,
        metric_type: 'gauge',
        ...options.attributes
      },
      tenantId
    }, request);
  }

  /**
   * Record an error with tenant context
   */
  async error(
    error: Error | string,
    options: LogOptions = {},
    request?: any
  ): Promise<void> {
    const message = error instanceof Error ? error.message : error;
    const attributes = error instanceof Error 
      ? { 
          error_name: error.name,
          error_stack: error.stack,
          ...options.attributes 
        }
      : options.attributes;

    await this.log(`ERROR: ${message}`, {
      ...options,
      level: 'ERROR',
      attributes
    }, request);
  }

  /**
   * Flush all pending telemetry data
   */
  async flush(): Promise<void> {
    if (this.sdk) {
      // In OTEL, you would call forceFlush on exporters
      // For now, we'll add a small delay to allow async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Shutdown the SDK gracefully
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      this.isInitialized = false;
      console.log('[HyperDX SDK] Shutdown complete');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<SDKConfig> {
    return { ...this.config };
  }

  /**
   * Check if SDK is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Create a new HyperDX SDK instance
 */
export function createHyperDXSDK(config: SDKConfig): MultiTenantHyperDXSDK {
  return new MultiTenantHyperDXSDK(config);
}

// Default export
export default MultiTenantHyperDXSDK;