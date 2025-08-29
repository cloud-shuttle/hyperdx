// Placeholder ClickHouse client
export const client = {
  query: async (query: string | { query: string; query_params?: any }) => ({ 
    data: [],
    json: async () => [{
      avgLoadTime: 0,
      avgResponseTime: 0,
      p95LoadTime: 0,
      p95ResponseTime: 0,
      errorRate: 0,
      totalSessions: 0,
      uniqueUsers: 0,
      avgSessionDuration: 0,
      conversionRate: 0,
      engagementScore: 0,
      totalPatterns: 0,
      highConfidence: 0,
      criticalPatterns: 0,
      totalAnomalies: 0,
      criticalAnomalies: 0,
      page: '',
      avgTimeOnPage: 0,
      visits: 0,
      device: '',
      browser: '',
      sessions: 0,
      percentage: 0
    }]
  }),
  insert: async (table: string, data: any[]) => ({ success: true })
};

// Placeholder ClickHouse client getter
export const getClickhouseClient = () => ({
  host: 'localhost:8123',
  _host: 'localhost:8123',
  maxRowReadOnly: 1000,
  __query: async (params: any) => ({
    json: async () => ({ data: [] }),
    text: async () => '[]',
    stream: () => ({
      [Symbol.asyncIterator]: async function* () {
        yield { data: [] };
      },
      getReader: () => ({
        read: async () => ({ done: true, value: [] })
      })
    })
  }),
  query: async (params: any) => ({
    json: async () => ({ data: [] }),
    text: async () => '[]',
    stream: () => ({
      [Symbol.asyncIterator]: async function* () {
        yield { data: [] };
      },
      getReader: () => ({
        read: async () => ({ done: true, value: [] })
      })
    })
  }),
  insert: async (table: string, data: any[]) => ({ success: true }),
  queryChartConfig: async (params: any) => ({
    json: async () => ({ data: [] }),
    text: async () => '[]'
  })
});

// Placeholder hook for databases
export const useDatabasesDirect = (params?: any, options?: any) => {
  return {
    data: [
      { name: 'default' },
      { name: 'system' }
    ],
    isLoading: false,
    error: null
  };
};

// Placeholder hook for tables
export const useTablesDirect = (params?: any, options?: any) => {
  return {
    data: [
      { name: 'otel_logs' },
      { name: 'otel_metrics' },
      { name: 'otel_traces' }
    ],
    isLoading: false,
    error: null
  };
};
