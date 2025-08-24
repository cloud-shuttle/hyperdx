import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Eye, 
  Play, 
  Pause, 
  RefreshCw,
  Bell,
  BellOff,
  Settings,
  Maximize,
  Minimize,
  Wifi,
  WifiOff
} from 'lucide-react';

interface ClickStackRealTimeMonitorProps {
  teamId: string;
  onAlert?: (alert: RealTimeAlert) => void;
}

interface RealTimeMetrics {
  activeSessions: number;
  activeUsers: number;
  avgResponseTime: number;
  errorCount: number;
  requestsPerMinute: number;
  conversionRate: number;
  engagementScore: number;
}

interface RealTimeAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric?: string;
  value?: number;
  threshold?: number;
}

interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'session_start' | 'session_end' | 'error' | 'conversion' | 'pattern' | 'anomaly';
  userId: string;
  sessionId: string;
  data: any;
}

export const ClickStackRealTimeMonitor: React.FC<ClickStackRealTimeMonitorProps> = ({
  teamId,
  onAlert,
}) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const metricsRef = useRef<RealTimeMetrics | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real-time metrics
  const fetchRealTimeMetrics = async () => {
    try {
      const response = await fetch(`/api/clickstack/analytics/realtime?teamId=${teamId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        metricsRef.current = data;
        setLastUpdate(new Date());
        
        // Check for alerts based on metrics
        checkForAlerts(data);
      }
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Check for alerts based on current metrics
  const checkForAlerts = (currentMetrics: RealTimeMetrics) => {
    const newAlerts: RealTimeAlert[] = [];

    // Error rate alert
    if (currentMetrics.errorCount > 10) {
      newAlerts.push({
        id: `error-${Date.now()}`,
        type: 'error',
        title: 'High Error Rate',
        message: `Error count is ${currentMetrics.errorCount} in the last 5 minutes`,
        timestamp: new Date().toISOString(),
        severity: currentMetrics.errorCount > 50 ? 'critical' : 'high',
        metric: 'errorCount',
        value: currentMetrics.errorCount,
        threshold: 10
      });
    }

    // Response time alert
    if (currentMetrics.avgResponseTime > 2000) {
      newAlerts.push({
        id: `response-${Date.now()}`,
        type: 'warning',
        title: 'Slow Response Time',
        message: `Average response time is ${currentMetrics.avgResponseTime}ms`,
        timestamp: new Date().toISOString(),
        severity: currentMetrics.avgResponseTime > 5000 ? 'critical' : 'medium',
        metric: 'avgResponseTime',
        value: currentMetrics.avgResponseTime,
        threshold: 2000
      });
    }

    // Low engagement alert
    if (currentMetrics.engagementScore < 0.3) {
      newAlerts.push({
        id: `engagement-${Date.now()}`,
        type: 'warning',
        title: 'Low Engagement',
        message: `Engagement score is ${(currentMetrics.engagementScore * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        severity: 'medium',
        metric: 'engagementScore',
        value: currentMetrics.engagementScore,
        threshold: 0.3
      });
    }

    // Add new alerts
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
      newAlerts.forEach(alert => onAlert?.(alert));
    }
  };

  // Setup real-time event stream
  const setupEventStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(`/api/clickstack/events/stream?teamId=${teamId}`);
      
      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'metrics') {
          setMetrics(data.metrics);
          metricsRef.current = data.metrics;
          setLastUpdate(new Date());
          checkForAlerts(data.metrics);
        } else if (data.type === 'event') {
          setLiveEvents(prev => [data.event, ...prev.slice(0, 49)]); // Keep last 50 events
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus('disconnected');
        eventSource.close();
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          setConnectionStatus('reconnecting');
          setupEventStream();
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to setup event stream:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    fetchRealTimeMetrics();
    setupEventStream();
    
    // Update metrics every 30 seconds
    updateIntervalRef.current = setInterval(fetchRealTimeMetrics, 30000);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Clear alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'reconnecting': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Get alert color
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get event icon
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'session_start': return <Users className="h-4 w-4 text-green-600" />;
      case 'session_end': return <Users className="h-4 w-4 text-gray-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'conversion': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'pattern': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [teamId, isMonitoring]);

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : ''}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'disconnected' ? 'Disconnected' : 'Reconnecting...'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold">Real-Time Monitor</span>
                <Badge variant="outline">
                  {isMonitoring ? 'Live' : 'Paused'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
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
                onClick={fetchRealTimeMetrics}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </CardHeader>
      </Card>

      {/* Real-time Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.activeSessions}
                  </p>
                  <p className="text-xs text-gray-500">
                    {metrics.activeUsers} unique users
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.avgResponseTime.toFixed(0)}ms
                  </p>
                  <p className="text-xs text-gray-500">
                    {metrics.requestsPerMinute} req/min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(metrics.conversionRate * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Engagement: {(metrics.engagementScore * 100).toFixed(1)}%
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.errorCount}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last 5 minutes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts and Live Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Alerts</span>
                <Badge variant="outline">{alerts.length}</Badge>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearAlerts}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No alerts at the moment
                </p>
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
                          {new Date(alert.timestamp).toLocaleTimeString()}
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

        {/* Live Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Live Events</span>
              <Badge variant="outline">{liveEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {liveEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No live events at the moment
                </p>
              ) : (
                liveEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-3 p-2 rounded-lg border border-gray-200"
                  >
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {event.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        User: {event.userId.substring(0, 8)}... • {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
