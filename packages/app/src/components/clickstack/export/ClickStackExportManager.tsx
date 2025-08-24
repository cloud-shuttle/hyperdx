import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FilePdf, 
  FileJson, 
  Database, 
  Settings, 
  RefreshCw, 
  Clock, 
  Filter,
  Search,
  Template,
  Code,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Calendar,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';

// API calls will be made directly to /api/clickstack/export endpoints

interface ClickStackExportManagerProps {
  teamId: string;
  startTime?: string;
  endTime?: string;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'json' | 'csv' | 'pdf' | 'excel';
  icon: React.ReactNode;
}

interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  filename?: string;
  error?: string;
  timestamp: string;
}

export const ClickStackExportManager: React.FC<ClickStackExportManagerProps> = ({
  teamId,
  startTime,
  endTime,
}) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf' | 'excel'>('json');
  const [timeRange, setTimeRange] = useState('7d');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [customQuery, setCustomQuery] = useState('');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Export templates
  const exportTemplates: ExportTemplate[] = [
    {
      id: 'analytics-overview',
      name: 'Analytics Overview',
      description: 'Comprehensive analytics overview with key metrics and trends',
      format: 'json',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      id: 'session-replay',
      name: 'Session Replay Data',
      description: 'Complete session replay events and user interactions',
      format: 'json',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'pattern-analysis',
      name: 'Pattern Analysis',
      description: 'Pattern detection results and confidence scores',
      format: 'csv',
      icon: <Activity className="h-5 w-5" />
    },
    {
      id: 'anomaly-detection',
      name: 'Anomaly Detection',
      description: 'Anomaly detection results and severity analysis',
      format: 'excel',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    {
      id: 'performance-metrics',
      name: 'Performance Metrics',
      description: 'Detailed performance metrics and response times',
      format: 'csv',
      icon: <Zap className="h-5 w-5" />
    },
    {
      id: 'user-behavior',
      name: 'User Behavior',
      description: 'User behavior analysis and journey mapping',
      format: 'json',
      icon: <Users className="h-5 w-5" />
    }
  ];

  // Get format icon
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return <FileJson className="h-4 w-4" />;
      case 'csv': return <FileText className="h-4 w-4" />;
      case 'pdf': return <FilePdf className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Export using template
  const exportWithTemplate = async (templateId: string) => {
    try {
      setIsExporting(true);
      setError(null);
      setExportProgress(0);

      const jobId = `export-${Date.now()}`;
      const job: ExportJob = {
        id: jobId,
        type: templateId,
        format: exportFormat,
        status: 'processing',
        progress: 0,
        timestamp: new Date().toISOString()
      };

      setExportJobs(prev => [job, ...prev]);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await clickStackExportService.exportWithTemplate(teamId, templateId, {
        format: exportFormat,
        timeRange,
        startTime,
        endTime,
        includeMetadata
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      // Download the file
      clickStackExportService.downloadExport(result);

      // Update job status
      setExportJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'completed', progress: 100, filename: result.filename }
          : j
      ));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setExportJobs(prev => prev.map(j => 
        j.id === `export-${Date.now()}` 
          ? { ...j, status: 'failed', error: err instanceof Error ? err.message : 'Export failed' }
          : j
      ));
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Export custom query
  const exportCustomQuery = async () => {
    if (!customQuery.trim()) {
      setError('Please enter a custom query');
      return;
    }

    try {
      setIsExporting(true);
      setError(null);
      setExportProgress(0);

      const jobId = `export-${Date.now()}`;
      const job: ExportJob = {
        id: jobId,
        type: 'custom-query',
        format: exportFormat,
        status: 'processing',
        progress: 0,
        timestamp: new Date().toISOString()
      };

      setExportJobs(prev => [job, ...prev]);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await clickStackExportService.exportCustomQuery(teamId, customQuery, {
        format: exportFormat,
        timeRange,
        startTime,
        endTime,
        includeMetadata
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      // Download the file
      clickStackExportService.downloadExport(result);

      // Update job status
      setExportJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'completed', progress: 100, filename: result.filename }
          : j
      ));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setExportJobs(prev => prev.map(j => 
        j.id === `export-${Date.now()}` 
          ? { ...j, status: 'failed', error: err instanceof Error ? err.message : 'Export failed' }
          : j
      ));
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Clear completed jobs
  const clearCompletedJobs = () => {
    setExportJobs(prev => prev.filter(job => job.status !== 'completed'));
  };

  // Retry failed job
  const retryJob = (jobId: string) => {
    const job = exportJobs.find(j => j.id === jobId);
    if (job && job.type !== 'custom-query') {
      exportWithTemplate(job.type);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>ClickStack Export Manager</span>
                <Badge variant="outline">Advanced Export</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Export ClickStack data in multiple formats with templates and custom queries
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Export Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetadata"
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
              />
              <label htmlFor="includeMetadata" className="text-sm">
                Include metadata
              </label>
            </div>
            <div className="text-sm text-gray-600">
              <p>Format: {exportFormat.toUpperCase()}</p>
              <p>Time Range: {timeRange}</p>
              {startTime && <p>Start: {new Date(startTime).toLocaleDateString()}</p>}
              {endTime && <p>End: {new Date(endTime).toLocaleDateString()}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Export Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Total Exports:</span>
                <span className="font-medium">{exportJobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-medium text-green-600">
                  {exportJobs.filter(j => j.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-medium text-red-600">
                  {exportJobs.filter(j => j.status === 'failed').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Export Info</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>• JSON: Best for data analysis and APIs</p>
              <p>• CSV: Best for spreadsheet applications</p>
              <p>• PDF: Best for reports and documentation</p>
              <p>• Excel: Best for advanced analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Export Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Query</TabsTrigger>
          <TabsTrigger value="jobs">Export Jobs</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {template.icon}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon(template.format)}
                      <span className="text-sm text-gray-600">{template.format.toUpperCase()}</span>
                    </div>
                    <Button
                      onClick={() => exportWithTemplate(template.id)}
                      disabled={isExporting}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Custom Query Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5" />
                <span>Custom Query Export</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">ClickHouse Query</label>
                <Textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="SELECT * FROM logs WHERE tenant_id = 'your-team-id' AND timestamp >= now() - INTERVAL 7 DAY"
                  className="mt-1"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a valid ClickHouse query. The tenant_id filter will be automatically added.
                </p>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={exportCustomQuery}
                disabled={isExporting || !customQuery.trim()}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Custom Query
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Export Jobs</span>
                  <Badge variant="outline">{exportJobs.length}</Badge>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={clearCompletedJobs}>
                  Clear Completed
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {exportJobs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No export jobs yet</p>
              ) : (
                <div className="space-y-3">
                  {exportJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="text-sm font-medium">{job.type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(job.timestamp).toLocaleString()}
                          </p>
                          {job.filename && (
                            <p className="text-xs text-green-600">{job.filename}</p>
                          )}
                          {job.error && (
                            <p className="text-xs text-red-600">{job.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          {getFormatIcon(job.format)}
                          <span className="text-xs text-gray-500">{job.format.toUpperCase()}</span>
                        </div>
                        {job.status === 'processing' && (
                          <Progress value={job.progress} className="w-20" />
                        )}
                        {job.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryJob(job.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Progress */}
      {isExporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting...</span>
                <span className="text-sm text-gray-500">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
