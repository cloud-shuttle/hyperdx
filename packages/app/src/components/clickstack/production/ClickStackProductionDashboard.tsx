import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Server, 
  Activity, 
  Shield, 
  Database, 
  Cloud, 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Cpu,
  Memory,
  HardDrive,
  Network,
  Globe,
  Lock,
  Backup,
  Scale,
  Rollback,
  Play,
  Pause,
  RotateCcw,
  Info,
  Warning,
  Error,
  Success,
  Users,
  Target,
  Gauge,
  Monitor,
  Wrench,
  Download,
  Upload,
  Key,
  Bell
} from 'lucide-react';

// API calls will be made directly to /api/clickstack/production endpoints

interface ClickStackProductionDashboardProps {
  teamId: string;
}

interface ProductionAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  service?: string;
}

export const ClickStackProductionDashboard: React.FC<ClickStackProductionDashboardProps> = ({
  teamId,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1h');
  const [config, setConfig] = useState<any>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);
  const [healthChecks, setHealthChecks] = useState<any[]>([]);
  const [productionMetrics, setProductionMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<ProductionAlert[]>([]);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [isScalingModalOpen, setIsScalingModalOpen] = useState(false);
  const [scaleInstances, setScaleInstances] = useState(2);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch production data
  const fetchProductionData = async () => {
    try {
      const [currentConfig, currentDeploymentStatus, currentHealthChecks, currentMetrics, currentAlerts] = await Promise.all([
        clickStackProductionService.getConfig(),
        clickStackProductionService.getDeploymentStatus(),
        clickStackProductionService.getHealthChecks(),
        clickStackProductionService.getProductionMetrics(timeRange),
        clickStackProductionService.getProductionAlerts()
      ]);

      setConfig(currentConfig);
      setDeploymentStatus(currentDeploymentStatus);
      setHealthChecks(currentHealthChecks);
      setProductionMetrics(currentMetrics);
      setAlerts(currentAlerts);

    } catch (error) {
      console.error('Failed to fetch production data:', error);
    }
  };

  // Update configuration
  const updateConfig = async (updates: any) => {
    try {
      await clickStackProductionService.updateConfig(updates);
      await fetchProductionData();
    } catch (error) {
      console.error('Failed to update configuration:', error);
    }
  };

  // Rollback deployment
  const handleRollback = async () => {
    try {
      const success = await clickStackProductionService.rollbackDeployment(rollbackReason);
      if (success) {
        setIsRollbackModalOpen(false);
        setRollbackReason('');
        await fetchProductionData();
      }
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  // Scale deployment
  const handleScale = async () => {
    try {
      const success = await clickStackProductionService.scaleDeployment(scaleInstances);
      if (success) {
        setIsScalingModalOpen(false);
        await fetchProductionData();
      }
    } catch (error) {
      console.error('Scaling failed:', error);
    }
  };

  // Backup data
  const handleBackup = async () => {
    try {
      const success = await clickStackProductionService.backupData();
      if (success) {
        await fetchProductionData();
      }
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'deploying': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <XCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'deploying': return <Clock className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
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

  // Format memory size
  const formatMemorySize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchProductionData();
    const interval = setInterval(fetchProductionData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [teamId, timeRange, refreshKey]);

  const latestMetrics = productionMetrics.length > 0 ? productionMetrics[productionMetrics.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>ClickStack Production Dashboard</span>
                <Badge variant="outline">Production Ready</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Production deployment monitoring and management for ClickStack
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
                onClick={() => setRefreshKey(prev => prev + 1)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Deployment Status */}
      {deploymentStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Server className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Deployment Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deploymentStatus.status}
                  </p>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(deploymentStatus.status)}
                    <span className={`text-sm ml-1 ${deploymentStatus.status === 'healthy' ? 'text-green-600' : deploymentStatus.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {deploymentStatus.status === 'healthy' ? 'Operational' : deploymentStatus.status === 'degraded' ? 'Degraded' : 'Issues Detected'}
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
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Version</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deploymentStatus.version}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {deploymentStatus.deploymentId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Region</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config?.region || 'us-east-1'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {config?.instanceType || 't3.medium'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Instances</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config?.scaling?.minInstances || 2}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {config?.scaling?.autoScaling ? 'Auto-scaling' : 'Fixed'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Production Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthChecks.map((check) => (
                    <div
                      key={check.service}
                      className={`p-3 rounded-lg border ${getStatusColor(check.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(check.status)}
                          <div>
                            <h4 className="text-sm font-medium capitalize">{check.service}</h4>
                            <p className="text-xs opacity-75">
                              Response: {check.responseTime}ms
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {check.status}
                        </Badge>
                      </div>
                      {check.error && (
                        <p className="text-xs mt-2 opacity-75">{check.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Resource Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestMetrics && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">CPU Usage</span>
                        <span className="text-sm font-medium">{latestMetrics.cpu}%</span>
                      </div>
                      <Progress value={latestMetrics.cpu} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Memory Usage</span>
                        <span className="text-sm font-medium">{latestMetrics.memory}%</span>
                      </div>
                      <Progress value={latestMetrics.memory} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Disk Usage</span>
                        <span className="text-sm font-medium">{latestMetrics.disk}%</span>
                      </div>
                      <Progress value={latestMetrics.disk} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Network</span>
                        <span className="text-sm font-medium">{latestMetrics.network}%</span>
                      </div>
                      <Progress value={latestMetrics.network} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Service Health Checks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthChecks.map((check) => (
                  <div key={check.service} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(check.status)}
                        <h3 className="text-lg font-medium capitalize">{check.service}</h3>
                        <Badge variant="outline">{check.status}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        Last check: {new Date(check.lastCheck).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Response Time</p>
                        <p className="text-lg font-semibold">{check.responseTime}ms</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">CPU</p>
                        <p className="text-lg font-semibold">{check.metrics.cpu}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Memory</p>
                        <p className="text-lg font-semibold">{check.metrics.memory}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Disk</p>
                        <p className="text-lg font-semibold">{check.metrics.disk}%</p>
                      </div>
                    </div>

                    {check.error && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-600">{check.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gauge className="h-5 w-5" />
                <span>Production Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionMetrics.slice(-10).map((metric, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium capitalize">{metric.service}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Requests</p>
                        <p className="text-sm font-semibold">{metric.requests}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Errors</p>
                        <p className="text-sm font-semibold">{metric.errors}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Response Time</p>
                        <p className="text-sm font-semibold">{metric.responseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Throughput</p>
                        <p className="text-sm font-semibold">{metric.throughput} req/s</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Production Alerts</span>
                <Badge variant="outline">{alerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No production alerts</p>
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

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Deployment Operations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsRollbackModalOpen(true)}
                    >
                      <Rollback className="h-4 w-4 mr-2" />
                      Rollback Deployment
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsScalingModalOpen(true)}
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      Scale Deployment
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleBackup}
                    >
                      <Backup className="h-4 w-4 mr-2" />
                      Backup Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security & Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {config && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SSL Enabled</span>
                      <Switch
                        checked={config.security.sslEnabled}
                        onCheckedChange={(checked) => updateConfig({ security: { ...config.security, sslEnabled: checked } })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rate Limiting</span>
                      <Switch
                        checked={config.security.rateLimiting}
                        onCheckedChange={(checked) => updateConfig({ security: { ...config.security, rateLimiting: checked } })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto Scaling</span>
                      <Switch
                        checked={config.scaling.autoScaling}
                        onCheckedChange={(checked) => updateConfig({ scaling: { ...config.scaling, autoScaling: checked } })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monitoring</span>
                      <Switch
                        checked={config.monitoring.enabled}
                        onCheckedChange={(checked) => updateConfig({ monitoring: { ...config.monitoring, enabled: checked } })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Backup</span>
                      <Switch
                        checked={config.backup.enabled}
                        onCheckedChange={(checked) => updateConfig({ backup: { ...config.backup, enabled: checked } })}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rollback Modal */}
      {isRollbackModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Rollback Deployment</h3>
            <Textarea
              placeholder="Enter rollback reason..."
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <Button onClick={handleRollback} className="flex-1">
                Confirm Rollback
              </Button>
              <Button variant="outline" onClick={() => setIsRollbackModalOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scaling Modal */}
      {isScalingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Scale Deployment</h3>
            <div className="mb-4">
              <label className="text-sm font-medium">Number of Instances</label>
              <Input
                type="number"
                value={scaleInstances}
                onChange={(e) => setScaleInstances(parseInt(e.target.value))}
                min={config?.scaling?.minInstances || 1}
                max={config?.scaling?.maxInstances || 10}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleScale} className="flex-1">
                Scale Deployment
              </Button>
              <Button variant="outline" onClick={() => setIsScalingModalOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
