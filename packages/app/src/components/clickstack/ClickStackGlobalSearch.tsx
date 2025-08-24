import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Play,
  AlertTriangle,
  TrendingUp,
  Shield,
  Brain,
  Activity,
  Users,
  Clock,
  Eye,
  MousePointer,
  Target,
  Zap,
  Database,
  Server,
  Monitor,
  Wrench,
  Lightbulb,
  BarChart3,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface ClickStackSearchResult {
  id: string;
  type: 'session' | 'pattern' | 'anomaly' | 'prediction' | 'threat' | 'behavior' | 'performance' | 'export';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  confidence?: number;
  tags: string[];
  metadata: Record<string, any>;
}

interface ClickStackSearchFilters {
  types: string[];
  severity: string[];
  timeRange: string;
  tags: string[];
}

export const ClickStackGlobalSearch: React.FC<{
  teamId: string;
  onResultSelect?: (result: ClickStackSearchResult) => void;
}> = ({ teamId, onResultSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ClickStackSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ClickStackSearchFilters>({
    types: [],
    severity: [],
    timeRange: '7d',
    tags: []
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'timestamp' | 'severity'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Search across all ClickStack data
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clickstack/search/global?q=${encodeURIComponent(searchQuery)}&teamId=${teamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          sortBy,
          sortOrder,
          limit: 50
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        console.error('Search failed:', response.statusText);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, teamId, filters, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <Play className="h-4 w-4" />;
      case 'pattern':
        return <Brain className="h-4 w-4" />;
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4" />;
      case 'prediction':
        return <TrendingUp className="h-4 w-4" />;
      case 'threat':
        return <Shield className="h-4 w-4" />;
      case 'behavior':
        return <Users className="h-4 w-4" />;
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'export':
        return <Database className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'bg-blue-100 text-blue-800';
      case 'pattern':
        return 'bg-purple-100 text-purple-800';
      case 'anomaly':
        return 'bg-red-100 text-red-800';
      case 'prediction':
        return 'bg-green-100 text-green-800';
      case 'threat':
        return 'bg-orange-100 text-orange-800';
      case 'behavior':
        return 'bg-indigo-100 text-indigo-800';
      case 'performance':
        return 'bg-yellow-100 text-yellow-800';
      case 'export':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResultClick = (result: ClickStackSearchResult) => {
    onResultSelect?.(result);
  };

  const toggleFilter = (filterType: keyof ClickStackSearchFilters, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [filterType]: newValues
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      severity: [],
      timeRange: '7d',
      tags: []
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>ClickStack Global Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search across all ClickStack data (sessions, patterns, anomalies, predictions, threats, behaviors, performance, exports)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFilter('types', 'session')}
                className={filters.types.includes('session') ? 'bg-blue-50 border-blue-200' : ''}
              >
                <Play className="h-3 w-3 mr-1" />
                Sessions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFilter('types', 'pattern')}
                className={filters.types.includes('pattern') ? 'bg-purple-50 border-purple-200' : ''}
              >
                <Brain className="h-3 w-3 mr-1" />
                Patterns
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFilter('types', 'anomaly')}
                className={filters.types.includes('anomaly') ? 'bg-red-50 border-red-200' : ''}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Anomalies
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFilter('types', 'prediction')}
                className={filters.types.includes('prediction') ? 'bg-green-50 border-green-200' : ''}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Predictions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFilter('types', 'threat')}
                className={filters.types.includes('threat') ? 'bg-orange-50 border-orange-200' : ''}
              >
                <Shield className="h-3 w-3 mr-1" />
                Threats
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFilter('types', 'performance')}
                className={filters.types.includes('performance') ? 'bg-yellow-50 border-yellow-200' : ''}
              >
                <Zap className="h-3 w-3 mr-1" />
                Performance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="relevance">Relevance</option>
                  <option value="timestamp">Timestamp</option>
                  <option value="severity">Severity</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Results</span>
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Searching...</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 && !loading && searchQuery && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          )}

          {results.length === 0 && !loading && !searchQuery && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
              <p className="text-gray-600">Enter a search query to find ClickStack data</p>
            </div>
          )}

          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        <Badge className={getTypeColor(result.type)}>
                          {result.type}
                        </Badge>
                        {result.severity && (
                          <Badge className={getSeverityColor(result.severity)}>
                            {result.severity}
                          </Badge>
                        )}
                        {result.confidence && (
                          <Badge variant="outline">
                            {Math.round(result.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {result.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(result.timestamp).toLocaleString()}</span>
                        </div>
                        {result.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Filter className="h-3 w-3" />
                            <span>{result.tags.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Showing {results.length} results
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
