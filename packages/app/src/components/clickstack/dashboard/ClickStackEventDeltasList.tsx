import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Search, 
  BarChart3,
  Clock,
  Activity,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface ClickStackEventDeltasListProps {
  teamId: string;
  startTime?: string;
  endTime?: string;
}

interface ClickStackEventDelta {
  id: string;
  deltaId: string;
  eventType: string;
  metricName: string;
  baselineValue: number;
  currentValue: number;
  deltaPercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  timestamp: string;
  duration: number;
  impact: {
    sessions: number;
    users: number;
    revenue: number;
  };
  context: {
    previousValues: number[];
    trend: 'increasing' | 'decreasing' | 'stable';
    seasonality: boolean;
    correlation: string[];
  };
  recommendations: string[];
}

export const ClickStackEventDeltasList: React.FC<ClickStackEventDeltasListProps> = ({
  teamId,
  startTime,
  endTime,
}) => {
  const [deltas, setDeltas] = useState<ClickStackEventDelta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchEventDeltas = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/clickstack/dashboard/event-deltas?${new URLSearchParams({
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
          threshold: '10.0',
          limit: '50',
        })}`);

        if (response.ok) {
          const deltasData = await response.json();
          setDeltas(deltasData);
        } else {
          throw new Error('Failed to fetch event deltas');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event deltas');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDeltas();
  }, [teamId, startTime, endTime]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'false_positive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string, deltaPercent: number) => {
    if (trend === 'increasing' || deltaPercent > 0) {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    } else if (trend === 'decreasing' || deltaPercent < 0) {
      return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    } else {
      return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeltaColor = (deltaPercent: number) => {
    const absDelta = Math.abs(deltaPercent);
    if (absDelta >= 50) return 'text-red-600';
    if (absDelta >= 25) return 'text-orange-600';
    if (absDelta >= 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredDeltas = deltas.filter(delta => {
    const matchesSearch = searchTerm === '' || 
      delta.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delta.metricName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || delta.eventType === typeFilter;
    const matchesSeverity = severityFilter === 'all' || delta.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || delta.status === statusFilter;

    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  const sortedDeltas = [...filteredDeltas].sort((a, b) => {
    let aValue: any = a[sortBy as keyof ClickStackEventDelta];
    let bValue: any = b[sortBy as keyof ClickStackEventDelta];

    if (sortBy === 'timestamp') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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
          <TrendingUp className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Event Deltas</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Event Delta Analysis</span>
            <Badge variant="secondary">{deltas.length.toLocaleString()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search deltas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="error_rate">Error Rate</SelectItem>
                <SelectItem value="response_time">Response Time</SelectItem>
                <SelectItem value="throughput">Throughput</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp-desc">Recently Detected</SelectItem>
                <SelectItem value="timestamp-asc">Oldest First</SelectItem>
                <SelectItem value="deltaPercent-desc">Largest Delta</SelectItem>
                <SelectItem value="severity-desc">Highest Severity</SelectItem>
                <SelectItem value="impact.revenue-desc">Highest Revenue Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Event Deltas List */}
      <div className="space-y-4">
        {sortedDeltas.map((delta) => (
          <Card key={delta.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {delta.metricName}
                        </h3>
                        <Badge className={`text-xs ${getSeverityColor(delta.severity)}`}>
                          {delta.severity}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(delta.status)}`}>
                          {delta.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {delta.eventType} • {formatTimestamp(delta.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Delta Values */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Baseline</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {delta.baselineValue.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-500">Current</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {delta.currentValue.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-500">Delta</div>
                      <div className={`text-2xl font-bold flex items-center justify-center ${getDeltaColor(delta.deltaPercent)}`}>
                        {getTrendIcon(delta.context.trend, delta.deltaPercent)}
                        <span className="ml-1">
                          {delta.deltaPercent > 0 ? '+' : ''}{delta.deltaPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-500">Duration</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatDuration(delta.duration)}
                      </div>
                    </div>
                  </div>

                  {/* Impact Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-sm text-red-600 font-medium">Affected Sessions</div>
                      <div className="text-xl font-bold text-red-900">
                        {delta.impact.sessions.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium">Affected Users</div>
                      <div className="text-xl font-bold text-blue-900">
                        {delta.impact.users.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600 font-medium">Revenue Impact</div>
                      <div className="text-xl font-bold text-green-900">
                        {formatCurrency(delta.impact.revenue)}
                      </div>
                    </div>
                  </div>

                  {/* Context and Trends */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Trend:</span>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(delta.context.trend, delta.deltaPercent)}
                          <span className="text-sm font-medium capitalize">{delta.context.trend}</span>
                        </div>
                      </div>
                      {delta.context.seasonality && (
                        <Badge variant="outline" className="text-xs">
                          Seasonal
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Detected: {formatTimestamp(delta.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Correlations */}
                  {delta.context.correlation.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-900">Correlations</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {delta.context.correlation.slice(0, 3).map((corr, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {corr}
                          </Badge>
                        ))}
                        {delta.context.correlation.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{delta.context.correlation.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {delta.recommendations.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Recommendations</span>
                      </div>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {delta.recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analyze
                  </Button>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Trends
                  </Button>
                  <Button variant="outline" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Alert
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedDeltas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No event deltas found</h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No significant event deltas have been detected yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deltas</p>
                <p className="text-2xl font-bold text-gray-900">{deltas.length.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-600">Active Deltas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deltas.filter(d => d.status === 'active').length.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Avg Delta</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deltas.length > 0 
                    ? `${(deltas.reduce((acc, d) => acc + Math.abs(d.deltaPercent), 0) / deltas.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Impact</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(deltas.reduce((acc, d) => acc + d.impact.revenue, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
