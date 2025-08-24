import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  RefreshCw, 
  Play, 
  Pause,
  BarChart3,
  Cpu,
  Memory,
  HardDrive,
  Network,
  Gauge,
  Target,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  Wrench,
  Shield
} from 'lucide-react';

// API calls will be made directly to /api/clickstack/performance endpoints

interface ClickStackPerformanceMonitorProps {
  teamId: string;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metric?: string;
  value?: number;
  threshold?: number;
}

interface OptimizationRecommendation {
  id: string;
  category: 'cache' | 'query' | 'memory' | 'network';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  implemented: boolean;
}

export const ClickStackPerformanceMonitor: React.FC<ClickStackPerformanceMonitorProps> = ({
  teamId,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1h');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      const [metrics, stats, currentConfig] = await Promise.all([
        clickStackPerformanceService.getPerformanceMetrics(timeRange),
        clickStackPerformanceService.getCacheStatistics(),
        clickStackPerformanceService.getConfig()
      ]);

      setPerformanceMetrics(metrics);
      setCacheStats(stats);
      setConfig(currentConfig);

      // Check for performance alerts
      checkPerformanceAlerts(metrics, stats);
      
      // Generate optimization recommendations
      generateRecommendations(metrics, stats, currentConfig);

    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    }
  };

  // Check for performance alerts
  const checkPerformanceAlerts = (metrics: any[], stats: any) => {
    const newAlerts: PerformanceAlert[] = [];

    if (metrics.length > 0) {
      const latestMetric = metrics[metrics.length - 1];

      // Query time alert
      if (latestMetric.queryTime > 5000) {
        newAlerts.push({
          id: `query-time-${Date.now()}`,
          type: 'warning',
          title: 'Slow Query Performance',
          message: `Average query time is ${latestMetric.queryTime}ms`,
          severity: latestMetric.queryTime > 10000 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          metric: 'queryTime',
          value: latestMetric.queryTime,
          threshold: 5000
        });
      }

      // Memory usage alert
      if (latestMetric.memoryUsage > 100 * 1024 * 1024) { // 100MB
        newAlerts.push({
          id: `memory-${Date.now()}`,
          type: 'warning',
          title: 'High Memory Usage',
          message: `Memory usage is ${(latestMetric.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
          severity: latestMetric.memoryUsage > 500 * 1024 * 1024 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          metric: 'memoryUsage',
          value: latestMetric.memoryUsage,
          threshold: 100 * 1024 * 1024
        });
      }

      // Error rate alert
      if (latestMetric.errorRate > 0.05) { // 5%
        newAlerts.push({
          id: `error-rate-${Date.now()}`,
          type: 'error',
          title: 'High Error Rate',
          message: `Error rate is ${(latestMetric.errorRate * 100).toFixed(1)}%`,
          severity: latestMetric.errorRate > 0.1 ? 'critical' : 'high',
          timestamp: new Date().toISOString(),
          metric: 'errorRate',
          value: latestMetric.errorRate,
          threshold: 0.05
        });
      }

      // Cache hit rate alert
      if (latestMetric.cacheHitRate < 0.5) { // 50%
        newAlerts.push({
          id: `cache-hit-${Date.now()}`,
          type: 'info',
          title: 'Low Cache Hit Rate',
          message: `Cache hit rate is ${(latestMetric.cacheHitRate * 100).toFixed(1)}%`,
          severity: latestMetric.cacheHitRate < 0.2 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          metric: 'cacheHitRate',
          value: latestMetric.cacheHitRate,
          threshold: 0.5
        });
      }
    }

    setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
  };

  // Generate optimization recommendations
  const generateRecommendations = (metrics: any[], stats: any, config: any) => {
    const newRecommendations: OptimizationRecommendation[] = [];

    if (metrics.length > 0) {
      const avgQueryTime = metrics.reduce((sum, m) => sum + m.queryTime, 0) / metrics.length;
      const avgCacheHitRate = metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length;

      // Cache optimization recommendations
      if (avgCacheHitRate < 0.6) {
        newRecommendations.push({
          id: 'cache-size-increase',
          category: 'cache',
          title: 'Increase Cache Size',
          description: 'Cache hit rate is low. Consider increasing cache capacity.',
          impact: 'high',
          effort: 'low',
          priority: 1,
          implemented: false
        });
      }

      if (avgQueryTime > 3000) {
        newRecommendations.push({
          id: 'query-optimization',
          category: 'query',
          title: 'Optimize Database Queries',
          description: 'Query performance is slow. Review and optimize database queries.',
          impact: 'high',
          effort: 'medium',
          priority: 2,
          implemented: false
        });
      }

      if (stats.queryCache.size > stats.queryCache.capacity * 0.8) {
        newRecommendations.push({
          id: 'cache-eviction',
          category: 'cache',
          title: 'Implement Cache Eviction',
          description: 'Cache is nearly full. Implement more aggressive eviction policies.',
          impact: 'medium',
          effort: 'low',
          priority: 3,
          implemented: false
        });
      }
    }

    setRecommendations(newRecommendations.sort((a, b) => b.priority - a.priority));
  };

  // Toggle monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      fetchPerformanceData();
    }
  };

  // Clear caches
  const clearCaches = async () => {
    try {
      clickStackPerformanceService.clearCaches();
      await fetchPerformanceData();
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  };

  // Update configuration
  const updateConfig = async (updates: any) => {
    try {
      clickStackPerformanceService.updateConfig(updates);
      await fetchPerformanceData();
    } catch (error) {
      console.error('Failed to update configuration:', error);
    }
  };

  // Get alert color
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get recommendation color
  const getRecommendationColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Format memory size
  const formatMemorySize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  useEffect(() => {
    if (isMonitoring) {
      fetchPerformanceData();
      const interval = setInterval(fetchPerformanceData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [teamId, timeRange, isMonitoring, refreshKey]);

  const latestMetrics = performanceMetrics.length > 0 ? performanceMetrics[performanceMetrics.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>ClickStack Performance Monitor</span>
                <Badge variant="outline">Production Ready</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Real-time performance monitoring and optimization for ClickStack
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
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMonitoring}
              >
                {isMonitoring ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey(prev => prev + 1)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Performance Metrics */}
      {latestMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Query Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(latestMetrics.queryTime)}
                  </p>
                  <div className="flex items-center mt-1">
                    {latestMetrics.queryTime > 3000 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                    <span className={`text-sm ml-1 ${latestMetrics.queryTime > 3000 ? 'text-red-600' : 'text-green-600'}`}>
                      {latestMetrics.queryTime > 3000 ? 'Slow' : 'Good'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(latestMetrics.cacheHitRate * 100).toFixed(1)}%
                  </p>
                  <div className="flex items-center mt-1">
                    {latestMetrics.cacheHitRate > 0.7 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className={`text-sm ml-1 ${latestMetrics.cacheHitRate > 0.7 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {latestMetrics.cacheHitRate > 0.7 ? 'Good' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Memory className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMemorySize(latestMetrics.memoryUsage)}
                  </p>
                  <div className="flex items-center mt-1">
                    {latestMetrics.memoryUsage > 100 * 1024 * 1024 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                    <span className={`text-sm ml-1 ${latestMetrics.memoryUsage > 100 * 1024 * 1024 ? 'text-red-600' : 'text-green-600'}`}>
                      {latestMetrics.memoryUsage > 100 * 1024 * 1024 ? 'High' : 'Normal'}
                    </span>
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
                    {(latestMetrics.errorRate * 100).toFixed(2)}%
                  </p>
                  <div className="flex items-center mt-1">
                    {latestMetrics.errorRate > 0.05 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                    <span className={`text-sm ml-1 ${latestMetrics.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                      {latestMetrics.errorRate > 0.05 ? 'High' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Performance Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics.slice(-10).map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">{formatTime(metric.queryTime)}</span>
                        <span className="text-sm">{(metric.cacheHitRate * 100).toFixed(1)}%</span>
                        <span className="text-sm">{formatMemorySize(metric.memoryUsage)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {config && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Query Cache</span>
                      <Switch
                        checked={config.query.enableQueryCache}
                        onCheckedChange={(checked) => updateConfig({ query: { ...config.query, enableQueryCache: checked } })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Result Cache</span>
                      <Switch
                        checked={config.query.enableResultCache}
                        onCheckedChange={(checked) => updateConfig({ query: { ...config.query, enableResultCache: checked } })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Performance Monitoring</span>
                      <Switch
                        checked={config.monitoring.enabled}
                        onCheckedChange={(checked) => updateConfig({ monitoring: { ...config.monitoring, enabled: checked } })}
                      />
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" onClick={clearCaches}>
                        Clear Caches
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          {cacheStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Query Cache</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cache Size</span>
                      <span className="text-sm font-medium">
                        {cacheStats.queryCache.size} / {cacheStats.queryCache.capacity}
                      </span>
                    </div>
                    <Progress value={(cacheStats.queryCache.size / cacheStats.queryCache.capacity) * 100} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Hit Rate</span>
                      <span className="text-sm font-medium">
                        {(cacheStats.queryCache.hitRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5" />
                    <span>Result Cache</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cache Size</span>
                      <span className="text-sm font-medium">
                        {cacheStats.resultCache.size} / {cacheStats.resultCache.capacity}
                      </span>
                    </div>
                    <Progress value={(cacheStats.resultCache.size / cacheStats.resultCache.capacity) * 100} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Hit Rate</span>
                      <span className="text-sm font-medium">
                        {(cacheStats.resultCache.hitRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Performance Alerts</span>
                <Badge variant="outline">{alerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No performance alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{alert.title}</h4>
                          <p className="text-xs mt-1">{alert.message}</p>
                          <p className="text-xs mt-1 opacity-75">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Optimization Recommendations</span>
                <Badge variant="outline">{recommendations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No optimization recommendations</p>
                ) : (
                  recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium">{recommendation.title}</h4>
                            <Badge variant="outline" className={`text-xs ${getRecommendationColor(recommendation.impact)}`}>
                              {recommendation.impact} impact
                            </Badge>
                          </div>
                          <p className="text-xs mt-1 text-gray-600">{recommendation.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">
                              Effort: {recommendation.effort}
                            </span>
                            <span className="text-xs text-gray-500">
                              Priority: {recommendation.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {recommendation.implemented ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Button variant="outline" size="sm">
                              <Wrench className="h-3 w-3 mr-1" />
                              Implement
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
