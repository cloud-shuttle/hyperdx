import { client } from '@/clickhouse';

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  timeRange: string;
  startTime?: string;
  endTime?: string;
  filters?: Record<string, any>;
  includeMetadata?: boolean;
  compression?: boolean;
}

interface ExportResult {
  data: any;
  filename: string;
  mimeType: string;
  size: number;
  timestamp: string;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  query: string;
  parameters: string[];
  format: 'json' | 'csv' | 'pdf' | 'excel';
}

export class ClickStackExportService {
  private static instance: ClickStackExportService;

  private constructor() {}

  public static getInstance(): ClickStackExportService {
    if (!ClickStackExportService.instance) {
      ClickStackExportService.instance = new ClickStackExportService();
    }
    return ClickStackExportService.instance;
  }

  /**
   * Export analytics data in multiple formats
   */
  async exportAnalyticsData(teamId: string, options: ExportOptions): Promise<ExportResult> {
    const data = await this.fetchAnalyticsData(teamId, options);
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(data, options);
      case 'csv':
        return this.exportAsCSV(data, options);
      case 'pdf':
        return this.exportAsPDF(data, options);
      case 'excel':
        return this.exportAsExcel(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export session replay data
   */
  async exportSessionReplayData(teamId: string, sessionId: string, options: ExportOptions): Promise<ExportResult> {
    const data = await this.fetchSessionReplayData(teamId, sessionId, options);
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(data, options);
      case 'csv':
        return this.exportAsCSV(data, options);
      case 'pdf':
        return this.exportAsPDF(data, options);
      case 'excel':
        return this.exportAsExcel(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export pattern analysis data
   */
  async exportPatternData(teamId: string, options: ExportOptions): Promise<ExportResult> {
    const data = await this.fetchPatternData(teamId, options);
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(data, options);
      case 'csv':
        return this.exportAsCSV(data, options);
      case 'pdf':
        return this.exportAsPDF(data, options);
      case 'excel':
        return this.exportAsExcel(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export anomaly detection data
   */
  async exportAnomalyData(teamId: string, options: ExportOptions): Promise<ExportResult> {
    const data = await this.fetchAnomalyData(teamId, options);
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(data, options);
      case 'csv':
        return this.exportAsCSV(data, options);
      case 'pdf':
        return this.exportAsPDF(data, options);
      case 'excel':
        return this.exportAsExcel(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export custom query results
   */
  async exportCustomQuery(teamId: string, query: string, options: ExportOptions): Promise<ExportResult> {
    const data = await this.executeCustomQuery(teamId, query, options);
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(data, options);
      case 'csv':
        return this.exportAsCSV(data, options);
      case 'pdf':
        return this.exportAsPDF(data, options);
      case 'excel':
        return this.exportAsExcel(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Get available export templates
   */
  async getExportTemplates(): Promise<ExportTemplate[]> {
    return [
      {
        id: 'analytics-overview',
        name: 'Analytics Overview',
        description: 'Comprehensive analytics overview with key metrics',
        query: 'SELECT * FROM clickstack_analytics_overview WHERE tenant_id = {teamId:String}',
        parameters: ['teamId'],
        format: 'json'
      },
      {
        id: 'session-replay',
        name: 'Session Replay Data',
        description: 'Session replay events and analytics',
        query: 'SELECT * FROM clickstack_sessions WHERE tenant_id = {teamId:String}',
        parameters: ['teamId'],
        format: 'json'
      },
      {
        id: 'pattern-analysis',
        name: 'Pattern Analysis',
        description: 'Pattern detection and analysis results',
        query: 'SELECT * FROM clickstack_patterns WHERE tenant_id = {teamId:String}',
        parameters: ['teamId'],
        format: 'csv'
      },
      {
        id: 'anomaly-detection',
        name: 'Anomaly Detection',
        description: 'Anomaly detection results and analysis',
        query: 'SELECT * FROM clickstack_anomalies WHERE tenant_id = {teamId:String}',
        parameters: ['teamId'],
        format: 'excel'
      }
    ];
  }

  /**
   * Export using a template
   */
  async exportWithTemplate(teamId: string, templateId: string, options: ExportOptions): Promise<ExportResult> {
    const templates = await this.getExportTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const data = await this.executeTemplateQuery(teamId, template, options);
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(data, options);
      case 'csv':
        return this.exportAsCSV(data, options);
      case 'pdf':
        return this.exportAsPDF(data, options);
      case 'excel':
        return this.exportAsExcel(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Fetch analytics data from ClickHouse
   */
  private async fetchAnalyticsData(teamId: string, options: ExportOptions) {
    const timeFilter = this.buildTimeFilter(options);
    
    const query = `
      SELECT 
        timestamp,
        clickstack_session_id,
        clickstack_user_id,
        clickstack_page_url,
        clickstack_event_type,
        clickstack_load_time,
        clickstack_response_time,
        clickstack_error_count,
        clickstack_conversion,
        clickstack_engagement_score,
        clickstack_device_type,
        clickstack_browser,
        clickstack_country,
        clickstack_city
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND ${timeFilter}
        AND clickstack_session_id IS NOT NULL
      ORDER BY timestamp DESC
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId
      }
    });

    const data = await result.json();
    
    if (options.includeMetadata) {
      return {
        metadata: {
          exportTimestamp: new Date().toISOString(),
          teamId,
          timeRange: options.timeRange,
          startTime: options.startTime,
          endTime: options.endTime,
          totalRecords: data.length,
          format: options.format
        },
        data
      };
    }
    
    return data;
  }

  /**
   * Fetch session replay data
   */
  private async fetchSessionReplayData(teamId: string, sessionId: string, options: ExportOptions) {
    const timeFilter = this.buildTimeFilter(options);
    
    const query = `
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
        AND ${timeFilter}
      ORDER BY timestamp ASC
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId,
        sessionId
      }
    });

    const data = await result.json();
    
    if (options.includeMetadata) {
      return {
        metadata: {
          exportTimestamp: new Date().toISOString(),
          teamId,
          sessionId,
          timeRange: options.timeRange,
          totalEvents: data.length,
          format: options.format
        },
        data
      };
    }
    
    return data;
  }

  /**
   * Fetch pattern data
   */
  private async fetchPatternData(teamId: string, options: ExportOptions) {
    const timeFilter = this.buildTimeFilter(options);
    
    const query = `
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
      ORDER BY timestamp DESC
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId
      }
    });

    const data = await result.json();
    
    if (options.includeMetadata) {
      return {
        metadata: {
          exportTimestamp: new Date().toISOString(),
          teamId,
          timeRange: options.timeRange,
          totalPatterns: data.length,
          format: options.format
        },
        data
      };
    }
    
    return data;
  }

  /**
   * Fetch anomaly data
   */
  private async fetchAnomalyData(teamId: string, options: ExportOptions) {
    const timeFilter = this.buildTimeFilter(options);
    
    const query = `
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
      ORDER BY timestamp DESC
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId
      }
    });

    const data = await result.json();
    
    if (options.includeMetadata) {
      return {
        metadata: {
          exportTimestamp: new Date().toISOString(),
          teamId,
          timeRange: options.timeRange,
          totalAnomalies: data.length,
          format: options.format
        },
        data
      };
    }
    
    return data;
  }

  /**
   * Execute custom query
   */
  private async executeCustomQuery(teamId: string, query: string, options: ExportOptions) {
    // Add tenant filter to custom query
    const tenantFilteredQuery = query.replace(
      /WHERE/i,
      `WHERE tenant_id = {teamId:String} AND`
    );

    const result = await client.query({
      query: tenantFilteredQuery,
      query_params: {
        teamId
      }
    });

    const data = await result.json();
    
    if (options.includeMetadata) {
      return {
        metadata: {
          exportTimestamp: new Date().toISOString(),
          teamId,
          customQuery: query,
          totalRecords: data.length,
          format: options.format
        },
        data
      };
    }
    
    return data;
  }

  /**
   * Execute template query
   */
  private async executeTemplateQuery(teamId: string, template: ExportTemplate, options: ExportOptions) {
    const result = await client.query({
      query: template.query,
      query_params: {
        teamId
      }
    });

    const data = await result.json();
    
    if (options.includeMetadata) {
      return {
        metadata: {
          exportTimestamp: new Date().toISOString(),
          teamId,
          template: template.name,
          templateId: template.id,
          totalRecords: data.length,
          format: options.format
        },
        data
      };
    }
    
    return data;
  }

  /**
   * Export as JSON
   */
  private exportAsJSON(data: any, options: ExportOptions): ExportResult {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    return {
      data: blob,
      filename: `clickstack-export-${options.timeRange}-${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json',
      size: blob.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export as CSV
   */
  private exportAsCSV(data: any, options: ExportOptions): ExportResult {
    if (!Array.isArray(data)) {
      throw new Error('CSV export requires array data');
    }

    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    
    return {
      data: blob,
      filename: `clickstack-export-${options.timeRange}-${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
      size: blob.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export as PDF
   */
  private exportAsPDF(data: any, options: ExportOptions): ExportResult {
    // TODO: Implement PDF export using a library like jsPDF
    // For now, return a placeholder
    const pdfContent = `ClickStack Export Report\nGenerated: ${new Date().toISOString()}\n\nData: ${JSON.stringify(data, null, 2)}`;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    
    return {
      data: blob,
      filename: `clickstack-export-${options.timeRange}-${new Date().toISOString().split('T')[0]}.pdf`,
      mimeType: 'application/pdf',
      size: blob.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export as Excel
   */
  private exportAsExcel(data: any, options: ExportOptions): ExportResult {
    // TODO: Implement Excel export using a library like xlsx
    // For now, return a placeholder
    const excelContent = `ClickStack Export Report\nGenerated: ${new Date().toISOString()}\n\nData: ${JSON.stringify(data, null, 2)}`;
    const blob = new Blob([excelContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    return {
      data: blob,
      filename: `clickstack-export-${options.timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: blob.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Build time filter based on time range
   */
  private buildTimeFilter(options: ExportOptions): string {
    if (options.startTime && options.endTime) {
      return `timestamp >= {startTime:DateTime} AND timestamp <= {endTime:DateTime}`;
    }

    const now = new Date();
    let startTime: Date;

    switch (options.timeRange) {
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
   * Download export file
   */
  downloadExport(exportResult: ExportResult): void {
    const url = URL.createObjectURL(exportResult.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get export statistics
   */
  async getExportStatistics(teamId: string): Promise<any> {
    const query = `
      SELECT 
        count() as totalExports,
        uniqExact(clickstack_export_format) as uniqueFormats,
        max(timestamp) as lastExport
      FROM logs 
      WHERE tenant_id = {teamId:String}
        AND clickstack_export_id IS NOT NULL
    `;

    const result = await client.query({
      query,
      query_params: {
        teamId
      }
    });

    const data = await result.json();
    return data[0] || {
      totalExports: 0,
      uniqueFormats: 0,
      lastExport: null
    };
  }
}

// Export singleton instance
export const clickStackExportService = ClickStackExportService.getInstance();
