import { useMemo } from 'react';
import ms from 'ms';
import { ResponseJSON, Row } from '@clickhouse/client-web';
import {
  ChSql,
  ClickHouseQueryError,
  ColumnMetaType,
} from '@hyperdx/common-utils/dist/clickhouse';
import { renderChartConfig } from '@hyperdx/common-utils/dist/renderChartConfig';
import { ChartConfigWithDateRange } from '@hyperdx/common-utils/dist/types';
import {
  QueryClient,
  QueryFunction,
  useInfiniteQuery,
  useQueryClient,
  useQuery,
} from '@tanstack/react-query';

import { getClickhouseClient } from '@/clickhouse';
import { getMetadata } from '@/metadata';
import { omit } from '@/utils';

// Placeholder implementation to fix build errors
export const useOffsetPaginatedQuery = (
  config: ChartConfigWithDateRange,
  options: any = {},
) => {
  const result = useQuery({
    queryKey: ['offset-paginated', config],
    queryFn: async () => ({
      data: [],
      meta: [],
      total: 0,
      page: 0,
      pageSize: 10,
    }),
    retry: 1,
    retryDelay: 1000,
    ...options,
  });

  return {
    ...result,
    fetchNextPage: () => {},
    hasNextPage: false,
  };
};
