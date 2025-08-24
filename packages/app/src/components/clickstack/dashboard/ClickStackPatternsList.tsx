import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

interface ClickStackPatternsListProps {
  teamId: string;
  startTime?: string;
  endTime?: string;
}

interface ClickStackPattern {
  id: string;
  patternId: string;
  patternType: string;
  patternName: string;
  description: string;
  confidence: number;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'investigating';
  impact: {
    sessions: number;
    users: number;
    conversionRate: number;
  };
  tags: string[];
  recommendations: string[];
}

export const ClickStackPatternsList: React.FC<ClickStackPatternsListProps> = ({
  teamId,
  startTime,
  endTime,
}) => {
  const [patterns, setPatterns] = useState<ClickStackPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('lastSeen');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/clickstack/dashboard/patterns?${new URLSearchParams({
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
          confidence: '0.8',
          limit: '50',
        })}`);

        if (response.ok) {
          const patternsData = await response.json();
          setPatterns(patternsData);
        } else {
          throw new Error('Failed to fetch patterns');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patterns');
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, [teamId, startTime, endTime]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
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
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    if (confidence >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredPatterns = patterns.filter(pattern => {
    const matchesSearch = searchTerm === '' || 
      pattern.patternName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.patternType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || pattern.patternType === typeFilter;
    const matchesSeverity = severityFilter === 'all' || pattern.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || pattern.status === statusFilter;

    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  const sortedPatterns = [...filteredPatterns].sort((a, b) => {
    let aValue: any = a[sortBy as keyof ClickStackPattern];
    let bValue: any = b[sortBy as keyof ClickStackPattern];

    if (sortBy === 'firstSeen' || sortBy === 'lastSeen') {
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
          <Target className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Patterns</h3>
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
            <Target className="h-5 w-5" />
            <span>Pattern Recognition</span>
            <Badge variant="secondary">{patterns.length.toLocaleString()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patterns..."
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
                <SelectItem value="user_behavior">User Behavior</SelectItem>
                <SelectItem value="error_pattern">Error Pattern</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="business">Business</SelectItem>
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
                <SelectItem value="lastSeen-desc">Recently Seen</SelectItem>
                <SelectItem value="lastSeen-asc">Oldest First</SelectItem>
                <SelectItem value="confidence-desc">Highest Confidence</SelectItem>
                <SelectItem value="frequency-desc">Most Frequent</SelectItem>
                <SelectItem value="severity-desc">Highest Severity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patterns List */}
      <div className="space-y-4">
        {sortedPatterns.map((pattern) => (
          <Card key={pattern.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Target className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {pattern.patternName}
                        </h3>
                        <Badge className={`text-xs ${getSeverityColor(pattern.severity)}`}>
                          {pattern.severity}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(pattern.status)}`}>
                          {pattern.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {pattern.patternType} • {pattern.frequency} occurrences
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    {pattern.description}
                  </p>

                  {/* Confidence and Impact */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Confidence</span>
                        <span className={`text-sm font-semibold ${getConfidenceColor(pattern.confidence)}`}>
                          {formatPercentage(pattern.confidence)}
                        </span>
                      </div>
                      <Progress value={pattern.confidence * 100} className="h-2" />
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {pattern.impact.sessions.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Affected Sessions</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPercentage(pattern.impact.conversionRate)}
                      </div>
                      <div className="text-sm text-gray-500">Conversion Impact</div>
                    </div>
                  </div>

                  {/* Tags and Timeline */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {pattern.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {pattern.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{pattern.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Last seen: {formatTimestamp(pattern.lastSeen)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {pattern.recommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Recommendations</span>
                      </div>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {pattern.recommendations.slice(0, 2).map((rec, index) => (
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

      {sortedPatterns.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patterns found</h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No patterns have been detected yet.'
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patterns</p>
                <p className="text-2xl font-bold text-gray-900">{patterns.length.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-600">Active Patterns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patterns.filter(p => p.status === 'active').length.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patterns.filter(p => p.status === 'resolved').length.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
