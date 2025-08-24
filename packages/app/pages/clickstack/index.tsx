import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Play,
  Search,
  AlertTriangle,
  TrendingUp,
  Shield,
  Brain,
  Activity,
  Settings,
  Users,
  Clock,
  Eye,
  MousePointer,
  Target,
  Zap,
  Globe,
  Database,
  Server,
  Monitor,
  Wrench,
  Lightbulb,
  BookOpen,
  GraduationCap,
  HelpCircle
} from 'lucide-react';

import { ClickStackDashboard } from '@/components/clickstack/dashboard/ClickStackDashboard';
import { ClickStackAnalyticsDashboard } from '@/components/clickstack/analytics/ClickStackAnalyticsDashboard';
import { ClickStackRealTimeMonitor } from '@/components/clickstack/realtime/ClickStackRealTimeMonitor';
import { ClickStackAdvancedDashboard } from '@/components/clickstack/advanced/ClickStackAdvancedDashboard';
import { ClickStackPerformanceMonitor } from '@/components/clickstack/performance/ClickStackPerformanceMonitor';
import { ClickStackProductionDashboard } from '@/components/clickstack/production/ClickStackProductionDashboard';
import { ClickStackExportManager } from '@/components/clickstack/export/ClickStackExportManager';
import { ClickStackDeploymentDashboard } from '@/components/clickstack/deployment/ClickStackDeploymentDashboard';

interface ClickStackHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    anomalyDetection: string;
    predictiveAnalytics: string;
    securityAnalysis: string;
    sessionReplay: string;
    patternRecognition: string;
  };
  lastCheck: string;
}

interface ClickStackFeatures {
  anomalyDetection: {
    enabled: boolean;
    version: string;
    status: string;
  };
  predictiveAnalytics: {
    enabled: boolean;
    version: string;
    status: string;
  };
  sessionReplay: {
    enabled: boolean;
    version: string;
    status: string;
  };
  patternRecognition: {
    enabled: boolean;
    version: string;
    status: string;
  };
  securityAnalysis: {
    enabled: boolean;
    version: string;
    status: string;
  };
}

export default function ClickStackPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState<ClickStackHealth | null>(null);
  const [features, setFeatures] = useState<ClickStackFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ClickStack health and features
  useEffect(() => {
    const fetchClickStackStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const [healthResponse, featuresResponse] = await Promise.all([
          fetch('/api/clickstack/health'),
          fetch('/api/clickstack/features')
        ]);

        if (healthResponse.ok && featuresResponse.ok) {
          const healthData = await healthResponse.json();
          const featuresData = await featuresResponse.json();
          
          setHealth(healthData.data);
          setFeatures(featuresData.data.features);
        } else {
          throw new Error('Failed to fetch ClickStack status');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ClickStack status');
      } finally {
        setLoading(false);
      }
    };

    fetchClickStackStatus();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'degraded':
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'unhealthy':
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ClickStack...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ClickStack Unavailable</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ClickStack</h1>
                  <p className="text-sm text-gray-600">Advanced Observability Platform</p>
                </div>
              </div>
              {health && (
                <Badge className={getStatusColor(health.status)}>
                  {getStatusIcon(health.status)}
                  <span className="ml-1 capitalize">{health.status}</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="sm">
                <GraduationCap className="h-4 w-4 mr-2" />
                Training
              </Button>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                  <p className="text-sm text-green-600">+12% from last week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sessions Today</p>
                  <p className="text-2xl font-bold text-gray-900">8,934</p>
                  <p className="text-sm text-green-600">+8% from yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                  <p className="text-sm text-red-600">+5 from last hour</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ML Insights</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                  <p className="text-sm text-green-600">+23 from yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Status */}
        {features && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Feature Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(features).map(([key, feature]) => (
                  <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(feature.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-gray-600">v{feature.version}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Real-time</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Advanced</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>Production</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Export</span>
            </TabsTrigger>
            <TabsTrigger value="deployment" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>Deployment</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ClickStackDashboard teamId="default" />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ClickStackAnalyticsDashboard 
              teamId="default"
              startTime={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
              endTime={new Date().toISOString()}
            />
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <ClickStackRealTimeMonitor 
              teamId="default"
              onAlert={(alert) => console.log('Alert:', alert)}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <ClickStackAdvancedDashboard teamId="default" />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <ClickStackPerformanceMonitor teamId="default" />
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            <ClickStackProductionDashboard teamId="default" />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ClickStackExportManager 
              teamId="default"
              startTime={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
              endTime={new Date().toISOString()}
            />
          </TabsContent>

          <TabsContent value="deployment" className="space-y-6">
            <ClickStackDeploymentDashboard teamId="default" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
