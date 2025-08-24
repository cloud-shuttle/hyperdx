import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  Square,
  RotateCcw,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Database,
  Shield,
  Users,
  FileText,
  BarChart3,
  Zap,
  Globe,
  Monitor,
  LifeBuoy,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface DeploymentConfig {
  environment: 'staging' | 'production';
  version: string;
  timestamp: string;
  features: {
    anomalyDetection: boolean;
    predictiveAnalytics: boolean;
    sessionReplay: boolean;
    patternRecognition: boolean;
    securityAnalysis: boolean;
  };
  scaling: {
    minReplicas: number;
    maxReplicas: number;
    targetCPUUtilization: number;
    targetMemoryUtilization: number;
  };
  monitoring: {
    enabled: boolean;
    metrics: boolean;
    logs: boolean;
    alerts: boolean;
    dashboards: boolean;
  };
  security: {
    encryption: boolean;
    authentication: boolean;
    authorization: boolean;
    auditLogging: boolean;
    rateLimiting: boolean;
  };
  backup: {
    enabled: boolean;
    frequency: string;
    retention: string;
    encryption: boolean;
  };
}

interface DeploymentStatus {
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';
  stage: string;
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
  logs: string[];
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  details: Record<string, any>;
}

interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  details: Record<string, any>;
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  user: {
    id: string;
    email: string;
    team: string;
  };
  attachments: string[];
  comments: any[];
}

interface ClickStackDeploymentDashboardProps {
  teamId: string;
}

export const ClickStackDeploymentDashboard: React.FC<ClickStackDeploymentDashboardProps> = ({
  teamId,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [deployEnvironment, setDeployEnvironment] = useState<'staging' | 'production'>('staging');
  const [rollbackReason, setRollbackReason] = useState('');

  useEffect(() => {
    fetchDeploymentData();
    const interval = setInterval(fetchDeploymentData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [teamId]);

  const fetchDeploymentData = async () => {
    try {
      // Fetch deployment configuration
      const configResponse = await fetch('/api/deployment/config');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setDeploymentConfig(configData.data);
      }

      // Fetch deployment status
      const statusResponse = await fetch('/api/deployment/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setDeploymentStatus(statusData.data);
      }

      // Fetch health checks
      const healthResponse = await fetch('/api/deployment/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthChecks(healthData.data);
      }

      // Fetch alerts
      const alertsResponse = await fetch('/api/deployment/monitoring/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.data);
      }

      // Fetch support tickets
      const ticketsResponse = await fetch('/api/deployment/support/tickets');
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setSupportTickets(ticketsData.data);
      }
    } catch (error) {
      console.error('Error fetching deployment data:', error);
    }
  };

  const startDeployment = async () => {
    setIsDeploying(true);
    try {
      const response = await fetch('/api/deployment/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: deployEnvironment }),
      });

      if (response.ok) {
        setShowDeployDialog(false);
        fetchDeploymentData();
      } else {
        const error = await response.json();
        alert(`Deployment failed: ${error.error}`);
      }
    } catch (error) {
      alert(`Deployment failed: ${error}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const rollbackDeployment = async () => {
    setIsRollingBack(true);
    try {
      const response = await fetch('/api/deployment/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rollbackReason }),
      });

      if (response.ok) {
        setShowRollbackDialog(false);
        setRollbackReason('');
        fetchDeploymentData();
      } else {
        const error = await response.json();
        alert(`Rollback failed: ${error.error}`);
      }
    } catch (error) {
      alert(`Rollback failed: ${error}`);
    } finally {
      setIsRollingBack(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'healthy':
        return 'bg-green-500';
      case 'in-progress':
      case 'degraded':
        return 'bg-yellow-500';
      case 'failed':
      case 'unhealthy':
      case 'critical':
        return 'bg-red-500';
      case 'pending':
      case 'low':
        return 'bg-gray-500';
      case 'medium':
        return 'bg-orange-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'in-progress':
      case 'degraded':
        return <Clock className="h-4 w-4" />;
      case 'failed':
      case 'unhealthy':
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ClickStack Deployment</h1>
          <p className="text-muted-foreground">
            Manage deployment, monitoring, and go-live procedures
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
            <DialogTrigger asChild>
              <Button disabled={isDeploying}>
                <Play className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Deployment</DialogTitle>
                <DialogDescription>
                  Choose the environment and start the deployment process.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="environment">Environment</Label>
                  <Select value={deployEnvironment} onValueChange={(value: 'staging' | 'production') => setDeployEnvironment(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeployDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={startDeployment} disabled={isDeploying}>
                  {isDeploying ? 'Deploying...' : 'Start Deployment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={isRollingBack}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rollback Deployment</DialogTitle>
                <DialogDescription>
                  Provide a reason for the rollback and confirm the action.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Rollback Reason</Label>
                  <Textarea
                    id="reason"
                    value={rollbackReason}
                    onChange={(e) => setRollbackReason(e.target.value)}
                    placeholder="Describe the reason for rollback..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={rollbackDeployment} disabled={isRollingBack}>
                  {isRollingBack ? 'Rolling Back...' : 'Confirm Rollback'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="go-live">Go-Live</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Deployment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Deployment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deploymentStatus && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(deploymentStatus.status)}`} />
                      <span className="font-medium capitalize">{deploymentStatus.status}</span>
                    </div>
                    <Badge variant="outline">{deploymentStatus.stage}</Badge>
                  </div>
                  <Progress value={deploymentStatus.progress} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    Progress: {deploymentStatus.progress}%
                  </div>
                  {deploymentStatus.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{deploymentStatus.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Service Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthChecks.map((check) => (
                  <div key={check.service} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(check.status)}`} />
                    <div>
                      <div className="font-medium">{check.service}</div>
                      <div className="text-sm text-muted-foreground">
                        {check.responseTime}ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.filter(a => !a.resolved).length}</div>
                <p className="text-xs text-muted-foreground">
                  {alerts.filter(a => a.severity === 'critical').length} critical
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                <LifeBuoy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supportTickets.filter(t => t.status === 'open').length}</div>
                <p className="text-xs text-muted-foreground">
                  {supportTickets.filter(t => t.priority === 'critical').length} critical
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.9%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">350ms</div>
                <p className="text-xs text-muted-foreground">
                  Avg response time
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Deployment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deploymentConfig && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Environment</Label>
                      <div className="text-sm font-medium">{deploymentConfig.environment}</div>
                    </div>
                    <div>
                      <Label>Version</Label>
                      <div className="text-sm font-medium">{deploymentConfig.version}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Features</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                      {Object.entries(deploymentConfig.features).map(([feature, enabled]) => (
                        <Badge key={feature} variant={enabled ? 'default' : 'secondary'}>
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deployment Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Deployment Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deploymentStatus?.logs && (
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                  {deploymentStatus.logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.filter(a => !a.resolved).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={alert.acknowledged ? 'default' : 'outline'}>
                          {alert.acknowledged ? 'Acknowledged' : 'New'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthChecks.map((check) => (
                  <div key={check.service} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{check.service}</div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(check.status)}`} />
                    </div>
                    <div className="text-2xl font-bold mt-2">{check.responseTime}ms</div>
                    <div className="text-sm text-muted-foreground">
                      Last check: {new Date(check.lastCheck).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          {/* Support Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LifeBuoy className="h-5 w-5 mr-2" />
                Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.id}</TableCell>
                      <TableCell>{ticket.title}</TableCell>
                      <TableCell>
                        <Badge variant={ticket.priority === 'critical' ? 'destructive' : 'secondary'}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ticket.status === 'open' ? 'outline' : 'default'}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Go-Live Tab */}
        <TabsContent value="go-live" className="space-y-6">
          {/* Go-Live Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Go-Live Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Production Status</div>
                    <div className="text-sm text-muted-foreground">
                      ClickStack production deployment status
                    </div>
                  </div>
                  <Badge variant="outline">Ready for Go-Live</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Deployment</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      All services deployed successfully
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Monitoring</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Monitoring and alerting active
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Security</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Security measures in place
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Go-Live Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Go-Live Actions</CardTitle>
              <CardDescription>
                Complete the go-live process to make ClickStack available to all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Go-Live Process
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Monitor className="h-4 w-4 mr-2" />
                  Run Final Health Check
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Validation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
