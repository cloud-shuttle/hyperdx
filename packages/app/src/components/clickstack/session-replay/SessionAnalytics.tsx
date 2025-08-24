import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  MousePointer, 
  Keyboard, 
  Eye, 
  RotateCw, 
  AlertTriangle, 
  Info,
  Target,
  Users,
  Activity,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SessionEvent {
  id: string;
  timestamp: number;
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'error' | 'performance';
  data: {
    x?: number;
    y?: number;
    element?: string;
    value?: string;
    url?: string;
    error?: string;
    performance?: {
      loadTime: number;
      responseTime: number;
    };
  };
  metadata: {
    pageUrl: string;
    userAgent: string;
    viewport: { width: number; height: number };
  };
}

interface SessionAnalyticsProps {
  events: SessionEvent[];
  sessionId: string;
  userId: string;
}

interface AnalyticsData {
  totalEvents: number;
  sessionDuration: number;
  eventTypes: Record<string, number>;
  pageVisits: Record<string, number>;
  performanceMetrics: {
    avgLoadTime: number;
    avgResponseTime: number;
    totalErrors: number;
    errorRate: number;
  };
  userBehavior: {
    totalClicks: number;
    totalInputs: number;
    totalScrolls: number;
    totalNavigations: number;
    avgTimeBetweenEvents: number;
    conversion: boolean;
  };
  engagementMetrics: {
    engagementScore: number;
    interactionRate: number;
    bounceRate: number;
    sessionDepth: number;
  };
}

export const SessionAnalytics: React.FC<SessionAnalyticsProps> = ({
  events,
  sessionId,
  userId,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState<string>('all');

  const analyticsData = useMemo(() => {
    if (events.length === 0) {
      return null;
    }

    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const sessionDuration = sortedEvents[sortedEvents.length - 1].timestamp - sortedEvents[0].timestamp;

    // Event type counts
    const eventTypes: Record<string, number> = {};
    events.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    // Page visit counts
    const pageVisits: Record<string, number> = {};
    events.forEach(event => {
      const pageUrl = event.metadata.pageUrl;
      pageVisits[pageUrl] = (pageVisits[pageUrl] || 0) + 1;
    });

    // Performance metrics
    const performanceEvents = events.filter(e => e.type === 'performance');
    const avgLoadTime = performanceEvents.length > 0 
      ? performanceEvents.reduce((acc, e) => acc + (e.data.performance?.loadTime || 0), 0) / performanceEvents.length
      : 0;
    const avgResponseTime = performanceEvents.length > 0
      ? performanceEvents.reduce((acc, e) => acc + (e.data.performance?.responseTime || 0), 0) / performanceEvents.length
      : 0;
    const totalErrors = events.filter(e => e.type === 'error').length;
    const errorRate = events.length > 0 ? totalErrors / events.length : 0;

    // User behavior
    const totalClicks = events.filter(e => e.type === 'click').length;
    const totalInputs = events.filter(e => e.type === 'input').length;
    const totalScrolls = events.filter(e => e.type === 'scroll').length;
    const totalNavigations = events.filter(e => e.type === 'navigation').length;
    const avgTimeBetweenEvents = events.length > 1 
      ? sessionDuration / (events.length - 1)
      : 0;
    const conversion = events.some(e => e.data.url?.includes('success') || e.data.url?.includes('complete'));

    // Engagement metrics
    const interactions = totalClicks + totalInputs + totalScrolls;
    const engagementScore = events.length > 0 ? (interactions / events.length) * 100 : 0;
    const interactionRate = events.length > 0 ? interactions / events.length : 0;
    const bounceRate = events.length <= 1 ? 100 : 0;
    const sessionDepth = Object.keys(pageVisits).length;

    return {
      totalEvents: events.length,
      sessionDuration,
      eventTypes,
      pageVisits,
      performanceMetrics: {
        avgLoadTime,
        avgResponseTime,
        totalErrors,
        errorRate,
      },
      userBehavior: {
        totalClicks,
        totalInputs,
        totalScrolls,
        totalNavigations,
        avgTimeBetweenEvents,
        conversion,
      },
      engagementMetrics: {
        engagementScore,
        interactionRate,
        bounceRate,
        sessionDepth,
      },
    };
  }, [events]);

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

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">No session events available for analysis.</p>
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
                <span>Session Analytics</span>
                <Badge variant="outline">{analyticsData.totalEvents} Events</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                User: {userId} • Session: {sessionId.substring(0, 8)}...
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="behavior">User Behavior</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Metrics */}
      {selectedMetric === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Session Duration</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatDuration(analyticsData.sessionDuration)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.totalEvents}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pages Visited</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.keys(analyticsData.pageVisits).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    {analyticsData.userBehavior.conversion ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conversion</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.userBehavior.conversion ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Event Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.eventTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{count} events</span>
                      <div className="w-32">
                        <Progress 
                          value={(count / analyticsData.totalEvents) * 100} 
                          className="h-2" 
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {formatPercentage(count / analyticsData.totalEvents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Page Visits */}
          <Card>
            <CardHeader>
              <CardTitle>Page Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analyticsData.pageVisits)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([page, visits]) => (
                    <div key={page} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{page}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{visits} visits</span>
                        <Badge variant="outline">{visits}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Performance Metrics */}
      {selectedMetric === 'performance' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Load Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.performanceMetrics.avgLoadTime.toFixed(0)}ms
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
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.performanceMetrics.avgResponseTime.toFixed(0)}ms
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
                    <p className="text-sm font-medium text-gray-600">Total Errors</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.performanceMetrics.totalErrors}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(analyticsData.performanceMetrics.errorRate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Details */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Load Time Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Fast (&lt; 1s)</span>
                        <span className="text-green-600">Good</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Medium (1-3s)</span>
                        <span className="text-yellow-600">Acceptable</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Slow (&gt; 3s)</span>
                        <span className="text-red-600">Poor</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Error Analysis</h4>
                    <div className="space-y-2">
                      {analyticsData.performanceMetrics.totalErrors > 0 ? (
                        <div className="text-sm text-red-600">
                          <span className="font-medium">Issues Found:</span> {analyticsData.performanceMetrics.totalErrors} errors detected
                        </div>
                      ) : (
                        <div className="text-sm text-green-600">
                          <span className="font-medium">No Errors:</span> Session completed without errors
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* User Behavior */}
      {selectedMetric === 'behavior' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MousePointer className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.userBehavior.totalClicks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Keyboard className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Inputs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.userBehavior.totalInputs}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Scrolls</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.userBehavior.totalScrolls}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <RotateCw className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Navigations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.userBehavior.totalNavigations}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Behavior Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Behavior Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Interaction Patterns</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Avg Time Between Events</span>
                        <span>{formatDuration(analyticsData.userBehavior.avgTimeBetweenEvents)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Most Active Event Type</span>
                        <span className="capitalize">
                          {Object.entries(analyticsData.eventTypes)
                            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Conversion Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Conversion Status</span>
                        <span className={analyticsData.userBehavior.conversion ? 'text-green-600' : 'text-red-600'}>
                          {analyticsData.userBehavior.conversion ? 'Converted' : 'Not Converted'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Session Quality</span>
                        <span className={analyticsData.userBehavior.totalClicks > 5 ? 'text-green-600' : 'text-yellow-600'}>
                          {analyticsData.userBehavior.totalClicks > 5 ? 'High' : 'Low'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Engagement Metrics */}
      {selectedMetric === 'engagement' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.engagementMetrics.engagementScore.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Interaction Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(analyticsData.engagementMetrics.interactionRate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.engagementMetrics.bounceRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Session Depth</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.engagementMetrics.sessionDepth}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Engagement Level</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Score</span>
                        <span className={analyticsData.engagementMetrics.engagementScore > 50 ? 'text-green-600' : 'text-yellow-600'}>
                          {analyticsData.engagementMetrics.engagementScore > 50 ? 'High' : 'Low'}
                        </span>
                      </div>
                      <Progress 
                        value={analyticsData.engagementMetrics.engagementScore} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Session Quality</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Pages per Session</span>
                        <span>{analyticsData.engagementMetrics.sessionDepth}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Interactions per Event</span>
                        <span>{analyticsData.engagementMetrics.interactionRate.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
