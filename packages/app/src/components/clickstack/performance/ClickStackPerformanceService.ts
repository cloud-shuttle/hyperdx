import { client } from '@/clickhouse';

interface PerformanceMetrics {
  queryTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  throughput: number;
  errorRate: number;
  timestamp: string;
}

interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

interface QueryOptimizationConfig {
  enableQueryCache: boolean;
  enableResultCache: boolean;
  enableCompression: boolean;
  maxConcurrentQueries: number;
  queryTimeout: number;
}

interface PerformanceConfig {
  cache: CacheConfig;
  query: QueryOptimizationConfig;
  monitoring: {
    enabled: boolean;
    interval: number;
    retention: number;
  };
}

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private accessOrder: K[];

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end of access order
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key
      this.cache.set(key, value);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    } else {
      // Add new key
      if (this.cache.size >= this.capacity) {
        // Remove least recently used
        const lruKey = this.accessOrder.shift();
        if (lruKey) {
          this.cache.delete(lruKey);
        }
      }
      this.cache.set(key, value);
      this.accessOrder.push(key);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; capacity: number; hitRate: number } {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

export class ClickStackPerformanceService {
  private static instance: ClickStackPerformanceService;
  private config: PerformanceConfig;
  private queryCache: LRUCache<string, any>;
  private resultCache: LRUCache<string, any>;
  private performanceMetrics: PerformanceMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private activeQueries: Set<string> = new Set();

  private constructor() {
    this.config = {
      cache: {
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        strategy: 'lru'
      },
      query: {
        enableQueryCache: true,
        enableResultCache: true,
        enableCompression: true,
        maxConcurrentQueries: 10,
        queryTimeout: 30000 // 30 seconds
      },
      monitoring: {
        enabled: true,
        interval: 60000, // 1 minute
        retention: 24 * 60 * 60 * 1000 // 24 hours
      }
    };

    this.queryCache = new LRUCache<string, any>(this.config.cache.maxSize);
    this.resultCache = new LRUCache<string, any>(this.config.cache.maxSize);

    if (this.config.monitoring.enabled) {
      this.startPerformanceMonitoring();
    }
  }

  public static getInstance(): ClickStackPerformanceService {
    if (!ClickStackPerformanceService.instance) {
      ClickStackPerformanceService.instance = new ClickStackPerformanceService();
    }
    return ClickStackPerformanceService.instance;
  }

  /**
   * Execute optimized ClickHouse query with caching
   */
  async executeOptimizedQuery(
    query: string,
    params: Record<string, any>,
    options: {
      useCache?: boolean;
      cacheKey?: string;
      timeout?: number;
    } = {}
  ): Promise<any> {
    const startTime = Date.now();
    const queryId = options.cacheKey || this.generateCacheKey(query, params);

    try {
      // Check query cache
      if (options.useCache !== false && this.config.query.enableQueryCache) {
        const cachedResult = this.queryCache.get(queryId);
        if (cachedResult) {
          this.recordPerformanceMetrics({
            queryTime: Date.now() - startTime,
            memoryUsage: this.getMemoryUsage(),
            cacheHitRate: 1.0,
            throughput: 1,
            errorRate: 0,
            timestamp: new Date().toISOString()
          });
          return cachedResult;
        }
      }

      // Check concurrent query limit
      if (this.activeQueries.size >= this.config.query.maxConcurrentQueries) {
        throw new Error('Maximum concurrent queries reached');
      }

      this.activeQueries.add(queryId);

      // Execute query with timeout
      const timeout = options.timeout || this.config.query.queryTimeout;
      const result = await Promise.race([
        this.executeQuery(query, params),
        this.createTimeout(timeout)
      ]);

      // Cache result if enabled
      if (options.useCache !== false && this.config.query.enableResultCache) {
        this.resultCache.set(queryId, result);
      }

      this.recordPerformanceMetrics({
        queryTime: Date.now() - startTime,
        memoryUsage: this.getMemoryUsage(),
        cacheHitRate: 0.0,
        throughput: 1,
        errorRate: 0,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      this.recordPerformanceMetrics({
        queryTime: Date.now() - startTime,
        memoryUsage: this.getMemoryUsage(),
        cacheHitRate: 0.0,
        throughput: 0,
        errorRate: 1,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      this.activeQueries.delete(queryId);
    }
  }

  /**
   * Execute analytics query with optimization
   */
  async executeAnalyticsQuery(
    teamId: string,
    queryType: string,
    timeRange: string,
    filters?: Record<string, any>
  ): Promise<any> {
    const cacheKey = `analytics:${teamId}:${queryType}:${timeRange}:${JSON.stringify(filters)}`;
    
    return this.executeOptimizedQuery(
      this.buildAnalyticsQuery(queryType, timeRange, filters),
      { teamId, ...filters },
      { useCache: true, cacheKey }
    );
  }

  /**
   * Execute session replay query with optimization
   */
  async executeSessionReplayQuery(
    teamId: string,
    sessionId: string,
    options?: Record<string, any>
  ): Promise<any> {
    const cacheKey = `session:${teamId}:${sessionId}:${JSON.stringify(options)}`;
    
    return this.executeOptimizedQuery(
      this.buildSessionReplayQuery(sessionId, options),
      { teamId, sessionId, ...options },
      { useCache: true, cacheKey }
    );
  }

  /**
   * Execute pattern analysis query with optimization
   */
  async executePatternAnalysisQuery(
    teamId: string,
    timeRange: string,
    filters?: Record<string, any>
  ): Promise<any> {
    const cacheKey = `pattern:${teamId}:${timeRange}:${JSON.stringify(filters)}`;
    
    return this.executeOptimizedQuery(
      this.buildPatternAnalysisQuery(timeRange, filters),
      { teamId, ...filters },
      { useCache: true, cacheKey }
    );
  }

  /**
   * Execute anomaly detection query with optimization
   */
  async executeAnomalyDetectionQuery(
    teamId: string,
    timeRange: string,
    filters?: Record<string, any>
  ): Promise<any> {
    const cacheKey = `anomaly:${teamId}:${timeRange}:${JSON.stringify(filters)}`;
    
    return this.executeOptimizedQuery(
      this.buildAnomalyDetectionQuery(timeRange, filters),
      { teamId, ...filters },
      { useCache: true, cacheKey }
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(timeRange: string = '1h'): PerformanceMetrics[] {
    const now = Date.now();
    const rangeMs = this.parseTimeRange(timeRange);
    const cutoff = now - rangeMs;

    return this.performanceMetrics.filter(metric => 
      new Date(metric.timestamp).getTime() > cutoff
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    queryCache: { size: number; capacity: number; hitRate: number };
    resultCache: { size: number; capacity: number; hitRate: number };
  } {
    return {
      queryCache: this.queryCache.getStats(),
      resultCache: this.resultCache.getStats()
    };
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.queryCache.clear();
    this.resultCache.clear();
  }

  /**
   * Update performance configuration
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart monitoring if needed
    if (this.config.monitoring.enabled && !this.monitoringInterval) {
      this.startPerformanceMonitoring();
    } else if (!this.config.monitoring.enabled && this.monitoringInterval) {
      this.stopPerformanceMonitoring();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Execute raw ClickHouse query
   */
  private async executeQuery(query: string, params: Record<string, any>): Promise<any> {
    const result = await client.query({
      query,
      query_params: params
    });

    return result.json();
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Generate cache key from query and parameters
   */
  private generateCacheKey(query: string, params: Record<string, any>): string {
    return `query:${btoa(query)}:${btoa(JSON.stringify(params))}`;
  }

  /**
   * Build optimized analytics query
   */
  private buildAnalyticsQuery(
    queryType: string,
    timeRange: string,
    filters?: Record<string, any>
  ): string {
    const timeFilter = this.buildTimeFilter(timeRange);
    const filterConditions = filters ? this.buildFilterConditions(filters) : '';

    switch (queryType) {
      case 'overview':
        return `
          SELECT 
            count() as totalSessions,
            uniqExact(clickstack_user_id) as uniqueUsers,
            avg(clickstack_session_duration) as avgSessionDuration,
            sum(clickstack_conversion) / count() as conversionRate,
            sum(clickstack_error_count) / count() as errorRate,
            avg(clickstack_engagement_score) as engagementScore
          FROM logs 
          WHERE tenant_id = {teamId:String}
            AND ${timeFilter}
            AND clickstack_session_id IS NOT NULL
            ${filterConditions}
        `;

      case 'performance':
        return `
          SELECT 
            avg(clickstack_load_time) as avgLoadTime,
            avg(clickstack_response_time) as avgResponseTime,
            quantile(0.95)(clickstack_load_time) as p95LoadTime,
            quantile(0.95)(clickstack_response_time) as p95ResponseTime,
            sum(clickstack_error_count) / count() as errorRate
          FROM logs 
          WHERE tenant_id = {teamId:String}
            AND ${timeFilter}
            AND clickstack_load_time IS NOT NULL
            ${filterConditions}
        `;

      case 'patterns':
        return `
          SELECT 
            clickstack_pattern_name as pattern,
            avg(clickstack_pattern_confidence) as confidence,
            avg(clickstack_pattern_impact) as impact,
            count() as frequency
          FROM logs 
          WHERE tenant_id = {teamId:String}
            AND ${timeFilter}
            AND clickstack_pattern_id IS NOT NULL
            ${filterConditions}
          GROUP BY clickstack_pattern_name
          ORDER BY frequency DESC
          LIMIT 100
        `;

      case 'anomalies':
        return `
          SELECT 
            clickstack_anomaly_metric as metric,
            avg(clickstack_anomaly_delta) as delta,
            clickstack_anomaly_severity as severity,
            max(timestamp) as timestamp
          FROM logs 
          WHERE tenant_id = {teamId:String}
            AND ${timeFilter}
            AND clickstack_anomaly_id IS NOT NULL
            ${filterConditions}
          GROUP BY clickstack_anomaly_metric, clickstack_anomaly_severity
          ORDER BY timestamp DESC
          LIMIT 100
        `;

      default:
        throw new Error(`Unknown query type: ${queryType}`);
    }
  }

  /**
   * Build optimized session replay query
   */
  private buildSessionReplayQuery(sessionId: string, options?: Record<string, any>): string {
    const timeFilter = options?.timeRange ? this.buildTimeFilter(options.timeRange) : '';

    return `
      SELECT 
        timestamp,
        clickstack_session_id,
        clickstack_user_id,
        clickstack_event_type,
        clickstack_event_data,
        clickstack_page_url,
        clickstack_viewport_width,
        clickstack_viewport_height,
        clickstack_mouse_x,
        clickstack_mouse_y,
        clickstack_scroll_x,
        clickstack_scroll_y
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND clickstack_session_id = {sessionId:String}
        ${timeFilter ? `AND ${timeFilter}` : ''}
      ORDER BY timestamp ASC
    `;
  }

  /**
   * Build optimized pattern analysis query
   */
  private buildPatternAnalysisQuery(timeRange: string, filters?: Record<string, any>): string {
    const timeFilter = this.buildTimeFilter(timeRange);
    const filterConditions = filters ? this.buildFilterConditions(filters) : '';

    return `
      SELECT 
        timestamp,
        clickstack_pattern_id,
        clickstack_pattern_name,
        clickstack_pattern_confidence,
        clickstack_pattern_severity,
        clickstack_pattern_impact,
        clickstack_pattern_frequency,
        clickstack_session_id,
        clickstack_user_id
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_pattern_id IS NOT NULL
        ${filterConditions}
      ORDER BY timestamp DESC
      LIMIT 1000
    `;
  }

  /**
   * Build optimized anomaly detection query
   */
  private buildAnomalyDetectionQuery(timeRange: string, filters?: Record<string, any>): string {
    const timeFilter = this.buildTimeFilter(timeRange);
    const filterConditions = filters ? this.buildFilterConditions(filters) : '';

    return `
      SELECT 
        timestamp,
        clickstack_anomaly_id,
        clickstack_anomaly_metric,
        clickstack_anomaly_delta,
        clickstack_anomaly_severity,
        clickstack_anomaly_threshold,
        clickstack_session_id,
        clickstack_user_id
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_anomaly_id IS NOT NULL
        ${filterConditions}
      ORDER BY timestamp DESC
      LIMIT 1000
    `;
  }

  /**
   * Build time filter
   */
  private buildTimeFilter(timeRange: string): string {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return `timestamp >= {startTime:DateTime}`;
  }

  /**
   * Build filter conditions
   */
  private buildFilterConditions(filters: Record<string, any>): string {
    const conditions: string[] = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = {${key}:String}`);
      }
    });

    return conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';
  }

  /**
   * Parse time range to milliseconds
   */
  private parseTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      case '90d': return 90 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // 1 hour default
    }
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    
    // Clean up old metrics
    const retention = this.config.monitoring.retention;
    const cutoff = Date.now() - retention;
    this.performanceMetrics = this.performanceMetrics.filter(metric => 
      new Date(metric.timestamp).getTime() > cutoff
    );
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.recordPerformanceMetrics({
        queryTime: 0,
        memoryUsage: this.getMemoryUsage(),
        cacheHitRate: this.calculateCacheHitRate(),
        throughput: this.calculateThroughput(),
        errorRate: this.calculateErrorRate(),
        timestamp: new Date().toISOString()
      });
    }, this.config.monitoring.interval);
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    // TODO: Implement actual cache hit rate calculation
    return 0.8; // Placeholder
  }

  /**
   * Calculate throughput
   */
  private calculateThroughput(): number {
    // TODO: Implement actual throughput calculation
    return this.activeQueries.size;
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    // TODO: Implement actual error rate calculation
    return 0.01; // Placeholder
  }
}

// Export singleton instance
export const clickStackPerformanceService = ClickStackPerformanceService.getInstance();
