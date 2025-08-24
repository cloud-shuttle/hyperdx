import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Map, 
  ArrowRight, 
  ArrowDown, 
  Circle, 
  Square, 
  Triangle,
  Users,
  Target,
  TrendingUp,
  Clock,
  Eye,
  MousePointer,
  AlertTriangle,
  CheckCircle
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

interface UserJourneyMapProps {
  events: SessionEvent[];
  userId: string;
  sessionId: string;
}

interface JourneyStep {
  id: string;
  pageUrl: string;
  pageName: string;
  events: SessionEvent[];
  duration: number;
  conversion: boolean;
  errors: number;
  interactions: number;
  timestamp: number;
}

interface JourneyPath {
  steps: JourneyStep[];
  totalDuration: number;
  conversionRate: number;
  errorRate: number;
  engagementScore: number;
}

export const UserJourneyMap: React.FC<UserJourneyMapProps> = ({
  events,
  userId,
  sessionId,
}) => {
  const [viewMode, setViewMode] = useState<'flow' | 'funnel' | 'timeline'>('flow');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const journeyPath = useMemo(() => {
    const steps: JourneyStep[] = [];
    const pageGroups: Record<string, SessionEvent[]> = {};

    // Group events by page
    events.forEach(event => {
      const pageUrl = event.metadata.pageUrl;
      if (!pageGroups[pageUrl]) {
        pageGroups[pageUrl] = [];
      }
      pageGroups[pageUrl].push(event);
    });

    // Create journey steps
    Object.entries(pageGroups).forEach(([pageUrl, pageEvents], index) => {
      const sortedEvents = pageEvents.sort((a, b) => a.timestamp - b.timestamp);
      const startTime = sortedEvents[0].timestamp;
      const endTime = sortedEvents[sortedEvents.length - 1].timestamp;
      const duration = endTime - startTime;

      const errors = pageEvents.filter(e => e.type === 'error').length;
      const interactions = pageEvents.filter(e => e.type === 'click' || e.type === 'input').length;
      const conversion = pageEvents.some(e => e.data.url?.includes('success') || e.data.url?.includes('complete'));

      steps.push({
        id: `step-${index}`,
        pageUrl,
        pageName: getPageName(pageUrl),
        events: sortedEvents,
        duration,
        conversion,
        errors,
        interactions,
        timestamp: startTime,
      });
    });

    // Sort steps by timestamp
    steps.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate journey metrics
    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
    const conversionRate = steps.filter(s => s.conversion).length / steps.length;
    const errorRate = steps.reduce((acc, step) => acc + step.errors, 0) / steps.length;
    const engagementScore = steps.reduce((acc, step) => acc + step.interactions, 0) / steps.length;

    return {
      steps,
      totalDuration,
      conversionRate,
      errorRate,
      engagementScore,
    };
  }, [events]);

  const getPageName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path === '/') return 'Home';
      if (path.includes('login')) return 'Login';
      if (path.includes('dashboard')) return 'Dashboard';
      if (path.includes('profile')) return 'Profile';
      if (path.includes('checkout')) return 'Checkout';
      if (path.includes('success')) return 'Success';
      return path.split('/').pop() || 'Unknown Page';
    } catch {
      return 'Unknown Page';
    }
  };

  const getStepIcon = (step: JourneyStep) => {
    if (step.conversion) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (step.errors > 0) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (step.interactions > 5) return <MousePointer className="h-4 w-4 text-blue-600" />;
    return <Eye className="h-4 w-4 text-gray-600" />;
  };

  const getStepColor = (step: JourneyStep) => {
    if (step.conversion) return 'bg-green-100 border-green-300';
    if (step.errors > 0) return 'bg-red-100 border-red-300';
    if (step.interactions > 5) return 'bg-blue-100 border-blue-300';
    return 'bg-gray-100 border-gray-300';
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const seconds = Math.floor(timestamp / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Map className="h-5 w-5" />
                <span>User Journey Map</span>
                <Badge variant="outline">{journeyPath.steps.length} Steps</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                User: {userId} • Session: {sessionId.substring(0, 8)}...
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flow">Flow View</SelectItem>
                  <SelectItem value="funnel">Funnel View</SelectItem>
                  <SelectItem value="timeline">Timeline View</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Journey Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(journeyPath.totalDuration)}
                </p>
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
                  {(journeyPath.conversionRate * 100).toFixed(1)}%
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
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(journeyPath.errorRate * 100).toFixed(1)}%
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
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {journeyPath.engagementScore.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey Flow */}
      {viewMode === 'flow' && (
        <Card>
          <CardHeader>
            <CardTitle>Journey Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journeyPath.steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Step Content */}
                  <div className={`ml-4 flex-1 p-4 rounded-lg border ${getStepColor(step)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStepIcon(step)}
                        <div>
                          <h3 className="font-medium text-gray-900">{step.pageName}</h3>
                          <p className="text-sm text-gray-600">{step.pageUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(step.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MousePointer className="h-4 w-4" />
                          <span>{step.interactions}</span>
                        </div>
                        {step.errors > 0 && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{step.errors}</span>
                          </div>
                        )}
                        {step.conversion && (
                          <Badge className="bg-green-100 text-green-800">
                            Conversion
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Step Details */}
                    {showDetails && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Events:</span> {step.events.length}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {formatTimestamp(step.timestamp)}
                          </div>
                          <div>
                            <span className="font-medium">Clicks:</span> {step.events.filter(e => e.type === 'click').length}
                          </div>
                          <div>
                            <span className="font-medium">Inputs:</span> {step.events.filter(e => e.type === 'input').length}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {index < journeyPath.steps.length - 1 && (
                    <div className="flex-shrink-0 mx-4">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funnel View */}
      {viewMode === 'funnel' && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {journeyPath.steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Funnel Step */}
                  <div className="flex items-center justify-center">
                    <div className={`w-full max-w-md p-4 rounded-lg border ${getStepColor(step)}`}>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          {getStepIcon(step)}
                          <h3 className="font-medium text-gray-900">{step.pageName}</h3>
                        </div>
                        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                          <span>{formatDuration(step.duration)}</span>
                          <span>•</span>
                          <span>{step.interactions} interactions</span>
                          {step.errors > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-red-600">{step.errors} errors</span>
                            </>
                          )}
                        </div>
                        {step.conversion && (
                          <Badge className="mt-2 bg-green-100 text-green-800">
                            Conversion Point
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Funnel Arrow */}
                  {index < journeyPath.steps.length - 1 && (
                    <div className="flex justify-center mt-4">
                      <ArrowDown className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Journey Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Timeline Steps */}
              <div className="space-y-6">
                {journeyPath.steps.map((step, index) => (
                  <div key={step.id} className="relative flex items-start">
                    {/* Timeline Dot */}
                    <div className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg z-10" />

                    {/* Step Content */}
                    <div className={`ml-8 flex-1 p-4 rounded-lg border ${getStepColor(step)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{step.pageName}</h3>
                          <p className="text-sm text-gray-600">{formatTimestamp(step.timestamp)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{formatDuration(step.duration)}</Badge>
                          {step.conversion && (
                            <Badge className="bg-green-100 text-green-800">Conversion</Badge>
                          )}
                        </div>
                      </div>

                      {/* Step Details */}
                      {showDetails && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Events:</span> {step.events.length}
                            </div>
                            <div>
                              <span className="font-medium">Interactions:</span> {step.interactions}
                            </div>
                            <div>
                              <span className="font-medium">Errors:</span> {step.errors}
                            </div>
                            <div>
                              <span className="font-medium">URL:</span> {step.pageUrl}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
