import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  Search, 
  Eye, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';

import { ClickStackOverview } from './ClickStackOverview';
import { ClickStackMetrics } from './ClickStackMetrics';
import { ClickStackSessionsList } from './ClickStackSessionsList';
import { ClickStackPatternsList } from './ClickStackPatternsList';
import { ClickStackEventDeltasList } from './ClickStackEventDeltasList';

interface ClickStackDashboardProps {
  teamId: string;
  startTime?: string;
  endTime?: string;
}

interface ClickStackHealth {
  status: 'healthy' | 'warning' | 'error';
  version: string;
  uptime: number;
  features: string[];
}

interface ClickStackFeatures {
  sessionReplay: { enabled: boolean; version: string };
  patternRecognition: { enabled: boolean; version: string };
  eventDeltaAnalysis: { enabled: boolean; version: string };
}

export const ClickStackDashboard: React.FC<ClickStackDashboardProps> = ({
  teamId,
  startTime,
  endTime,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState<ClickStackHealth | null>(null);
  const [features, setFeatures] = useState<ClickStackFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch ClickStack health and features
        const [healthResponse, featuresResponse] = await Promise.all([
          fetch(`/api/clickstack/health`),
          fetch(`/api/clickstack/features`),
        ]);

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setHealth(healthData);
        }

        if (featuresResponse.ok) {
          const featuresData = await featuresResponse.json();
          setFeatures(featuresData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [teamId]);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ClickStack Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Advanced observability with session replay, pattern recognition, and analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {health && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(health.status)}`}></div>
              <span className="text-sm font-medium">
                {getHealthStatusText(health.status)}
              </span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            v{health?.version || '1.0.0'}
          </Badge>
        </div>
      </div>

      {/* Health and Features Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health ? getHealthStatusText(health.status) : 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {health ? Math.floor(health.uptime / 3600) : 0}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Replay</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {features?.sessionReplay.enabled ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              v{features?.sessionReplay.version || '1.0.0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pattern Recognition</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {features?.patternRecognition.enabled ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              v{features?.patternRecognition.version || '1.0.0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Delta Analysis</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {features?.eventDeltaAnalysis.enabled ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              v{features?.eventDeltaAnalysis.version || '1.0.0'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Eye className="h-6 w-6" />
              <span className="text-sm">Session Replay</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Target className="h-6 w-6" />
              <span className="text-sm">Pattern Recognition</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Search className="h-6 w-6" />
              <span className="text-sm">Advanced Search</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="deltas" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Event Deltas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ClickStackOverview 
            teamId={teamId} 
            startTime={startTime} 
            endTime={endTime} 
          />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <ClickStackMetrics 
            teamId={teamId} 
            startTime={startTime} 
            endTime={endTime} 
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <ClickStackSessionsList 
            teamId={teamId} 
            startTime={startTime} 
            endTime={endTime} 
          />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <ClickStackPatternsList 
            teamId={teamId} 
            startTime={startTime} 
            endTime={endTime} 
          />
        </TabsContent>

        <TabsContent value="deltas" className="space-y-4">
          <ClickStackEventDeltasList 
            teamId={teamId} 
            startTime={startTime} 
            endTime={endTime} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
