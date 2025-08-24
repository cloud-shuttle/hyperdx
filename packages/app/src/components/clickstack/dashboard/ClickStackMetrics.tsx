import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Target, 
  AlertTriangle,
  Users,
  Clock,
  Activity
} from 'lucide-react';

interface ClickStackMetricsProps {
  teamId: string;
  startTime?: string;
  endTime?: string;
}

interface ClickStackMetricsData {
  sessionMetrics: {
    totalSessions: number;
    avgDuration: number;
    bounceRate: number;
    conversionRate: number;
    topDevices: Array<{ device: string; count: number; percentage: number }>;
    topBrowsers: Array<{ browser: string; count: number; percentage: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
  };
  patternMetrics: {
    totalPatterns: number;
    avgConfidence: number;
    patternTypes: Array<{ type: string; count: number; percentage: number }>;
    topPatterns: Array<{ pattern: string; count: number; confidence: number }>;
    patternTrends: Array<{ date: string; count: number; confidence: number }>;
  };
  anomalyMetrics: {
    totalAnomalies: number;
    avgSeverity: number;
    anomalyTypes: Array<{ type: string; count: number; percentage: number }>;
    topAnomalies: Array<{ anomaly: string; count: number; severity: number }>;
    anomalyTrends: Array<{ date: string; count: number; severity: number }>;
  };
  performanceMetrics: {
    avgPageLoadTime: number;
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    performanceTrends: Array<{ date: string; loadTime: number; responseTime: number }>;
  };
}

export const ClickStackMetrics: React.FC<ClickStackMetricsProps> = ({
  teamId,
  startTime,
  endTime,
}) => {
  const [data, setData] = useState<ClickStackMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetricType, setSelectedMetricType] = useState('sessions');

  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/clickstack/dashboard/metrics?${new URLSearchParams({
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
          ...(selectedMetricType && { metricType: selectedMetricType }),
        })}`);

        if (response.ok) {
          const metricsData = await response.json();
          setData(metricsData);
        } else {
          throw new Error('Failed to fetch metrics data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics data');
      } finally {
        setLoading(false);
      }
    };

    fetchMetricsData();
  }, [teamId, startTime, endTime, selectedMetricType]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 0.8) return 'bg-red-500';
    if (severity >= 0.6) return 'bg-orange-500';
    if (severity >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Metrics</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No metrics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Metrics Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Metric Type:</label>
            <Select value={selectedMetricType} onValueChange={setSelectedMetricType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sessions">Session Metrics</SelectItem>
                <SelectItem value="patterns">Pattern Metrics</SelectItem>
                <SelectItem value="anomalies">Anomaly Metrics</SelectItem>
                <SelectItem value="performance">Performance Metrics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Session Metrics */}
      {selectedMetricType === 'sessions' && data.sessionMetrics && (
        <div className="space-y-6">
          {/* Key Session Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.sessionMetrics.totalSessions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Sessions recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(data.sessionMetrics.avgDuration)}</div>
                <p className="text-xs text-muted-foreground">
                  Per session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(data.sessionMetrics.bounceRate)}</div>
                <p className="text-xs text-muted-foreground">
                  Single page sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(data.sessionMetrics.conversionRate)}</div>
                <p className="text-xs text-muted-foreground">
                  Goal completions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Device and Browser Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Top Devices</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.sessionMetrics.topDevices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {device.device}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{device.count.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{formatPercentage(device.percentage)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Top Browsers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.sessionMetrics.topBrowsers.map((browser, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {browser.browser}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{browser.count.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{formatPercentage(browser.percentage)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Pattern Metrics */}
      {selectedMetricType === 'patterns' && data.patternMetrics && (
        <div className="space-y-6">
          {/* Key Pattern Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.patternMetrics.totalPatterns.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Patterns detected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(data.patternMetrics.avgConfidence)}</div>
                <p className="text-xs text-muted-foreground">
                  Pattern accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pattern Types</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.patternMetrics.patternTypes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Unique types
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pattern Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Pattern Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.patternMetrics.patternTypes.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pattern.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{pattern.count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{formatPercentage(pattern.percentage)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Anomaly Metrics */}
      {selectedMetricType === 'anomalies' && data.anomalyMetrics && (
        <div className="space-y-6">
          {/* Key Anomaly Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.anomalyMetrics.totalAnomalies.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Anomalies detected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Severity</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(data.anomalyMetrics.avgSeverity)}</div>
                <p className="text-xs text-muted-foreground">
                  Severity level
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anomaly Types</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.anomalyMetrics.anomalyTypes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Unique types
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Anomaly Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Anomaly Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.anomalyMetrics.anomalyTypes.map((anomaly, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getSeverityColor(anomaly.percentage)}`}>
                        <span className="text-xs font-medium text-white">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {anomaly.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{anomaly.count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{formatPercentage(anomaly.percentage)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {selectedMetricType === 'performance' && data.performanceMetrics && (
        <div className="space-y-6">
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Page Load</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(data.performanceMetrics.avgPageLoadTime)}</div>
                <p className="text-xs text-muted-foreground">
                  Page load time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(data.performanceMetrics.avgResponseTime)}</div>
                <p className="text-xs text-muted-foreground">
                  API response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(data.performanceMetrics.errorRate)}</div>
                <p className="text-xs text-muted-foreground">
                  Error percentage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performanceMetrics.throughput.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Requests per second
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
