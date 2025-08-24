import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  Target, 
  AlertTriangle, 
  Clock, 
  Eye, 
  MousePointer, 
  Zap, 
  Globe, 
  Smartphone, 
  Monitor,
  Filter,
  Download,
  Share2,
  Settings,
  RefreshCw,
  Calendar,
  Search,
  Filter as FilterIcon
} from 'lucide-react';

import { ClickStackOverview } from '../dashboard/ClickStackOverview';
import { ClickStackMetrics } from '../dashboard/ClickStackMetrics';
import { ClickStackSessionsList } from '../dashboard/ClickStackSessionsList';
import { ClickStackPatternsList } from '../dashboard/ClickStackPatternsList';
import { ClickStackEventDeltasList } from '../dashboard/ClickStackEventDeltasList';

interface ClickStackAnalyticsDashboardProps {
  teamId: string;
  startTime?: string;
  endTime?: string;
}

interface AnalyticsData {
  overview: {
    totalSessions: number;
    totalUsers: number;
    avgSessionDuration: number;
    conversionRate: number;
    errorRate: number;
    engagementScore: number;
  };
  trends: {
    sessions: { date: string; count: number }[];
    users: { date: string; count: number }[];
    conversions: { date: string; rate: number }[];
    errors: { date: string; count: number }[];
  };
  performance: {
    avgLoadTime: number;
    avgResponseTime: number;
    slowestPages: { page: string; loadTime: number }[];
    errorPages: { page: string; errorCount: number }[];
  };
  userBehavior: {
    topPages: { page: string; visits: number }[];
    userJourneys: { journey: string; users: number }[];
    deviceTypes: { device: string; percentage: number }[];
    browsers: { browser: string; percentage: number }[];
  };
  patterns: {
    totalPatterns: number;
    highConfidence: number;
    criticalPatterns: number;
    recentPatterns: { pattern: string; confidence: number; impact: number }[];
  };
  anomalies: {
    totalAnomalies: number;
    criticalAnomalies: number;
    recentAnomalies: { metric: string; delta: number; severity: string }[];
  };
}

export const ClickStackAnalyticsDashboard: React.FC<ClickStackAnalyticsDashboardProps> = ({
  teamId,
  startTime,
  endTime,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/clickstack/analytics/dashboard?timeRange=${timeRange}&startTime=${startTime}&endTime=${endTime}`);
        
        if (response.ok) {
          const analyticsData = await response.json();
          setData(analyticsData);
        } else {
          throw new Error('Failed to fetch analytics data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [teamId, timeRange, startTime, endTime, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = () => {
    // Export analytics data
    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange,
      data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clickstack-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Analytics</h3>
          <p className="text-gray-600">Fetching comprehensive analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">No analytics data available for the selected time range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>ClickStack Analytics Dashboard</span>
                <Badge variant="outline">Advanced Analytics</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive analytics and insights for your ClickStack data
              </p>
            </div>
            <div className="flex items-center space-x-2">
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
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.totalSessions.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">+12.5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(data.overview.conversionRate)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">+2.1%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.engagementScore.toFixed(1)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">+5.3%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(data.overview.errorRate)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">-1.2%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Session Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.trends.sessions.slice(0, 7).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{trend.date}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <Progress value={(trend.count / Math.max(...data.trends.sessions.map(s => s.count))) * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{trend.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Conversion Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.trends.conversions.slice(0, 7).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{trend.date}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <Progress value={trend.rate * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{formatPercentage(trend.rate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <ClickStackOverview teamId={teamId} startTime={startTime} endTime={endTime} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Load Time</span>
                    <span className="text-sm font-medium">{formatDuration(data.performance.avgLoadTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Response Time</span>
                    <span className="text-sm font-medium">{formatDuration(data.performance.avgResponseTime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Slowest Pages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.performance.slowestPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">{page.page}</span>
                      <span className="text-sm font-medium">{formatDuration(page.loadTime)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Top Pages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.userBehavior.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">{page.page}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24">
                          <Progress value={(page.visits / Math.max(...data.userBehavior.topPages.map(p => p.visits))) * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{page.visits}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Device Types</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.userBehavior.deviceTypes.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {device.device === 'Mobile' ? (
                          <Smartphone className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Monitor className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-600">{device.device}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24">
                          <Progress value={device.percentage} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{device.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.patterns.totalPatterns}</div>
                  <div className="text-sm text-gray-600">Total Patterns</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.patterns.highConfidence}</div>
                  <div className="text-sm text-gray-600">High Confidence</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.patterns.criticalPatterns}</div>
                  <div className="text-sm text-gray-600">Critical Patterns</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <ClickStackPatternsList teamId={teamId} startTime={startTime} endTime={endTime} />
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.anomalies.totalAnomalies}</div>
                  <div className="text-sm text-gray-600">Total Anomalies</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.anomalies.criticalAnomalies}</div>
                  <div className="text-sm text-gray-600">Critical Anomalies</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {((data.anomalies.criticalAnomalies / data.anomalies.totalAnomalies) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Critical Rate</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <ClickStackEventDeltasList teamId={teamId} startTime={startTime} endTime={endTime} />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <ClickStackSessionsList teamId={teamId} startTime={startTime} endTime={endTime} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
