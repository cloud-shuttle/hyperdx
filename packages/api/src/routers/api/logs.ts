import express, { Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';

import { setTenantContext, requireTenantContext } from '@/middleware/tenant';
import { 
  executeTenantsQuery, 
  TenantQueryBuilder,
  withTenantQuery 
} from '@/utils/clickhouse-query-filter';
import { 
  getTenantConfig, 
  auditTenantAction, 
  checkTenantFeature 
} from '@/utils/tenant';
import logger from '@/utils/logger';

const router = express.Router();

// Apply tenant middleware to all routes
router.use(setTenantContext);
router.use(requireTenantContext);

// Schema for log query parameters
const logQuerySchema = z.object({
  q: z.string().optional().default(''),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(), 
  level: z.array(z.string()).optional(),
  service: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(10000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  orderBy: z.enum(['timestamp', 'level']).optional().default('timestamp'),
  orderDirection: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

// GET /api/logs - Search logs with tenant filtering
router.get(
  '/',
  validateRequest({
    query: logQuerySchema
  }),
  async (req: any, res: Response) => {
    try {
      const {
        q,
        startDate,
        endDate,
        level,
        service,
        limit,
        offset,
        orderBy,
        orderDirection
      } = req.query;

      // Type conversion and validation
      const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : (Array.isArray(limit) ? parseInt(limit[0] as string, 10) : 100);
      const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : (Array.isArray(offset) ? parseInt(offset[0] as string, 10) : 0);
      const parsedStartDate = typeof startDate === 'string' ? startDate : undefined;
      const parsedEndDate = typeof endDate === 'string' ? endDate : undefined;
      const parsedOrderBy = typeof orderBy === 'string' ? orderBy : undefined;
      const parsedOrderDirection = typeof orderDirection === 'string' ? orderDirection : undefined;
      const parsedQ = typeof q === 'string' ? q : undefined;
      const parsedLevel = Array.isArray(level) ? level : (level ? [level] : []);
      const parsedService = Array.isArray(service) ? service : (service ? [service] : []);

      // Check tenant permissions
      if (!checkTenantFeature(req, 'dashboards')) {
        return res.status(403).json({
          error: 'Feature not enabled',
          message: 'Log search is not enabled for this tenant'
        });
      }

      // Get tenant configuration for limits
      const tenantConfig = getTenantConfig(req);
      const effectiveLimit = Math.min(parsedLimit, tenantConfig?.searchRowLimit || 1000);

      // Build time range
      const timeRange = parsedStartDate && parsedEndDate ? {
        start: new Date(parsedStartDate),
        end: new Date(parsedEndDate)
      } : undefined;

      // Build filters
      const filters: Record<string, any> = {};
      if (parsedLevel && parsedLevel.length > 0) {
        filters.level = parsedLevel;
      }
      if (parsedService && parsedService.length > 0) {
        filters.service_name = parsedService;
      }

      // Add search query filter if provided
      if (parsedQ && parsedQ.trim()) {
        // For full-text search, we'll use ClickHouse's capabilities
        filters._search_query = parsedQ.trim();
      }

      // Build query using tenant-aware query builder
      const queryBuilder = new TenantQueryBuilder(req);
      const { query, query_params } = queryBuilder.buildLogsQuery({
        timeRange,
        filters,
        limit: effectiveLimit,
        orderBy: parsedOrderBy,
        orderDirection: parsedOrderDirection as 'ASC' | 'DESC' | undefined
      });

      // Add search query handling if needed
      let finalQuery = query;
      if (parsedQ && parsedQ.trim()) {
        // Replace the basic query with full-text search
        finalQuery = finalQuery.replace(
          'SELECT *', 
          `SELECT *, multiSearchAny(message, [${query_params._search_query}]) as relevance`
        );
        finalQuery = finalQuery.replace(
          'WHERE', 
          `WHERE (positionCaseInsensitive(message, {_search_query:String}) > 0 OR positionCaseInsensitive(level, {_search_query:String}) > 0) AND`
        );
        query_params._search_query = parsedQ.trim();
      }

      // Add offset for pagination
      if (parsedOffset > 0) {
        finalQuery += ` OFFSET {offset:UInt32}`;
        query_params.offset = parsedOffset;
      }

      // Execute query
      const result = await executeTenantsQuery(req, {
        query: finalQuery,
        query_params,
        format: 'JSONEachRow'
      });

      const logs = await result.json() as any;

      // Get total count for pagination
      const countQueryResult = queryBuilder.buildLogsQuery({
        timeRange,
        filters,
        limit: 1,
        orderBy: parsedOrderBy,
        orderDirection: parsedOrderDirection as 'ASC' | 'DESC' | undefined
      });

      const totalCountQuery = countQueryResult.query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const countResult = await executeTenantsQuery(req, {
        query: totalCountQuery,
        query_params: countQueryResult.query_params
      });

      const countData = await countResult.json() as any;
      const total = countData.data?.[0]?.total || 0;

      // Audit log access
      auditTenantAction(req, 'logs_query', 'logs', {
        query: parsedQ,
        resultCount: (logs.data as any[])?.length || 0,
        timeRange,
        filters
      });

      logger.info('Logs query executed successfully', {
        tenantId: req.tenant!.id,
        resultCount: (logs.data as any[])?.length || 0,
        limit: effectiveLimit,
        hasSearch: !!parsedQ
      });

      res.json({
        logs: (logs.data as any[]) || [],
        pagination: {
          limit: effectiveLimit,
          offset: parsedOffset,
          total,
          hasMore: (parsedOffset + effectiveLimit) < total
        },
        query: {
          searchQuery: parsedQ,
          timeRange,
          filters: {
            level: parsedLevel,
            service: parsedService
          }
        }
      });

    } catch (error) {
      logger.error('Logs query failed', {
        tenantId: req.tenant?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        error: 'Query failed',
        message: 'Failed to execute logs query'
      });
    }
  }
);

// GET /api/logs/services - Get available services for tenant
router.get('/services', async (req: any, res) => {
  try {
    const query = `
      SELECT DISTINCT service_name, COUNT(*) as log_count
      FROM default.logs 
      WHERE tenant_id = {tenant_id:String}
        AND timestamp >= now() - INTERVAL 7 DAY
      GROUP BY service_name
      ORDER BY log_count DESC
      LIMIT 50
    `;

    const result = await executeTenantsQuery(req, {
      query,
      query_params: { tenant_id: req.tenant!.id }
    });

    const services = await result.json() as any;

    res.json({
      services: (services.data as any[]) || []
    });

  } catch (error) {
    logger.error('Services query failed', {
      tenantId: req.tenant?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Query failed',
      message: 'Failed to fetch services'
    });
  }
});

// GET /api/logs/levels - Get available log levels for tenant
router.get('/levels', async (req: any, res) => {
  try {
    const query = `
      SELECT level, COUNT(*) as count
      FROM default.logs
      WHERE tenant_id = {tenant_id:String}
        AND timestamp >= now() - INTERVAL 1 DAY  
      GROUP BY level
      ORDER BY count DESC
    `;

    const result = await executeTenantsQuery(req, {
      query,
      query_params: { tenant_id: req.tenant!.id }
    });

    const levels = await result.json() as any;

    res.json({
      levels: (levels.data as any[]) || []
    });

  } catch (error) {
    logger.error('Log levels query failed', {
      tenantId: req.tenant?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Query failed',
      message: 'Failed to fetch log levels'
    });
  }
});

// POST /api/logs/aggregate - Aggregate logs data 
router.post(
  '/aggregate',
  validateRequest({
    body: z.object({
      groupBy: z.array(z.string()).min(1),
      aggregation: z.enum(['count', 'sum', 'avg', 'max', 'min']).default('count'),
      field: z.string().optional(),
      timeRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime()
      }),
      filters: z.record(z.any()).optional().default({}),
      limit: z.number().int().min(1).max(1000).optional().default(100)
    })
  }),
  async (req: any, res) => {
    try {
      const { groupBy, aggregation, field, timeRange, filters, limit } = req.body;

      // Check feature permissions
      if (!checkTenantFeature(req, 'dashboards')) {
        return res.status(403).json({
          error: 'Feature not enabled',
          message: 'Log aggregation is not enabled for this tenant'
        });
      }

      const queryBuilder = new TenantQueryBuilder(req);
      const { query, query_params } = queryBuilder.buildAggregationQuery({
        table: 'logs',
        timeRange: {
          start: new Date(timeRange.start),
          end: new Date(timeRange.end)
        },
        groupBy,
        filters,
        aggregations: [{
          field: field || '*',
          function: aggregation,
          alias: 'value'
        }],
        limit
      });

      const result = await executeTenantsQuery(req, {
        query,
        query_params
      });

      const aggregations = await result.json() as any;

      auditTenantAction(req, 'logs_aggregate', 'logs', {
        groupBy,
        aggregation,
        resultCount: (aggregations.data as any[])?.length || 0
      });

      res.json({
        aggregations: (aggregations.data as any[]) || [],
        query: {
          groupBy,
          aggregation,
          field,
          timeRange,
          filters
        }
      });

    } catch (error) {
      logger.error('Log aggregation failed', {
        tenantId: req.tenant?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        error: 'Aggregation failed',
        message: 'Failed to execute log aggregation'
      });
    }
  }
);

export default router;