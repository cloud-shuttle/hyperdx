import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Bell,
  Eye,
  Brain,
  Activity,
  Shield,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Database,
  Server,
  Monitor,
  Wrench,
  Lightbulb,
  BarChart3,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface ClickStackPreferences {
  // Dashboard Preferences
  dashboard: {
    defaultTimeRange: string;
    autoRefresh: boolean;
    refreshInterval: number;
    showQuickStats: boolean;
    showFeatureStatus: boolean;
    defaultTab: string;
  };
  
  // Session Replay Preferences
  sessionReplay: {
    autoPlay: boolean;
    defaultSpeed: number;
    showHeatmap: boolean;
    showTimeline: boolean;
    includeMetadata: boolean;
    includePerformance: boolean;
  };
  
  // Anomaly Detection Preferences
  anomalyDetection: {
    sensitivity: number;
    alertThreshold: number;
    notificationChannels: string[];
    autoAcknowledge: boolean;
    showConfidence: boolean;
  };
  
  // Predictive Analytics Preferences
  predictiveAnalytics: {
    forecastHorizon: number;
    confidenceLevel: number;
    showTrends: boolean;
    autoRefresh: boolean;
    notificationThreshold: number;
  };
  
  // Security Preferences
  security: {
    threatNotifications: boolean;
    riskThreshold: number;
    autoBlock: boolean;
    auditLogging: boolean;
    complianceAlerts: boolean;
  };
  
  // Performance Preferences
  performance: {
    monitoringEnabled: boolean;
    alertThreshold: number;
    autoScaling: boolean;
    resourceOptimization: boolean;
    cacheEnabled: boolean;
  };
  
  // Export Preferences
  export: {
    defaultFormat: string;
    includeMetadata: boolean;
    compressionEnabled: boolean;
    autoSchedule: boolean;
    retentionPeriod: number;
  };
  
  // Notification Preferences
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
    inApp: boolean;
    frequency: string;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

const defaultPreferences: ClickStackPreferences = {
  dashboard: {
    defaultTimeRange: '24h',
    autoRefresh: true,
    refreshInterval: 30,
    showQuickStats: true,
    showFeatureStatus: true,
    defaultTab: 'overview'
  },
  sessionReplay: {
    autoPlay: false,
    defaultSpeed: 1,
    showHeatmap: true,
    showTimeline: true,
    includeMetadata: true,
    includePerformance: true
  },
  anomalyDetection: {
    sensitivity: 0.7,
    alertThreshold: 0.8,
    notificationChannels: ['inApp'],
    autoAcknowledge: false,
    showConfidence: true
  },
  predictiveAnalytics: {
    forecastHorizon: 24,
    confidenceLevel: 0.9,
    showTrends: true,
    autoRefresh: true,
    notificationThreshold: 0.8
  },
  security: {
    threatNotifications: true,
    riskThreshold: 0.7,
    autoBlock: false,
    auditLogging: true,
    complianceAlerts: true
  },
  performance: {
    monitoringEnabled: true,
    alertThreshold: 0.8,
    autoScaling: false,
    resourceOptimization: true,
    cacheEnabled: true
  },
  export: {
    defaultFormat: 'json',
    includeMetadata: true,
    compressionEnabled: true,
    autoSchedule: false,
    retentionPeriod: 30
  },
  notifications: {
    email: false,
    slack: false,
    webhook: false,
    inApp: true,
    frequency: 'immediate',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  }
};

export const ClickStackUserPreferences: React.FC<{
  teamId: string;
  onSave?: (preferences: ClickStackPreferences) => void;
}> = ({ teamId, onSave }) => {
  const [preferences, setPreferences] = useState<ClickStackPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/clickstack/preferences?teamId=${teamId}`);
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences || defaultPreferences);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [teamId]);

  // Save preferences
  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/clickstack/preferences?teamId=${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        setHasChanges(false);
        onSave?.(preferences);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  // Update preference
  const updatePreference = (section: keyof ClickStackPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ClickStack Preferences</h2>
          <p className="text-gray-600">Customize your ClickStack experience</p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
          <Button
            onClick={savePreferences}
            disabled={!hasChanges || saving}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Time Range</Label>
              <Select
                value={preferences.dashboard.defaultTimeRange}
                onValueChange={(value) => updatePreference('dashboard', 'defaultTimeRange', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Tab</Label>
              <Select
                value={preferences.dashboard.defaultTab}
                onValueChange={(value) => updatePreference('dashboard', 'defaultTab', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Refresh</Label>
              <p className="text-sm text-gray-600">Automatically refresh dashboard data</p>
            </div>
            <Switch
              checked={preferences.dashboard.autoRefresh}
              onCheckedChange={(checked) => updatePreference('dashboard', 'autoRefresh', checked)}
            />
          </div>
          {preferences.dashboard.autoRefresh && (
            <div>
              <Label>Refresh Interval (seconds)</Label>
              <Slider
                value={[preferences.dashboard.refreshInterval]}
                onValueChange={([value]) => updatePreference('dashboard', 'refreshInterval', value)}
                min={10}
                max={300}
                step={10}
                className="mt-2"
              />
              <p className="text-sm text-gray-600 mt-1">
                {preferences.dashboard.refreshInterval} seconds
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Replay Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Session Replay</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Playback Speed</Label>
              <Select
                value={preferences.sessionReplay.defaultSpeed.toString()}
                onValueChange={(value) => updatePreference('sessionReplay', 'defaultSpeed', parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Play</Label>
                <p className="text-sm text-gray-600">Automatically start replay when opened</p>
              </div>
              <Switch
                checked={preferences.sessionReplay.autoPlay}
                onCheckedChange={(checked) => updatePreference('sessionReplay', 'autoPlay', checked)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Heatmap</Label>
                <p className="text-sm text-gray-600">Display click heatmap overlay</p>
              </div>
              <Switch
                checked={preferences.sessionReplay.showHeatmap}
                onCheckedChange={(checked) => updatePreference('sessionReplay', 'showHeatmap', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Timeline</Label>
                <p className="text-sm text-gray-600">Display event timeline</p>
              </div>
              <Switch
                checked={preferences.sessionReplay.showTimeline}
                onCheckedChange={(checked) => updatePreference('sessionReplay', 'showTimeline', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detection Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Anomaly Detection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Detection Sensitivity</Label>
            <Slider
              value={[preferences.anomalyDetection.sensitivity]}
              onValueChange={([value]) => updatePreference('anomalyDetection', 'sensitivity', value)}
              min={0.1}
              max={1.0}
              step={0.1}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              {Math.round(preferences.anomalyDetection.sensitivity * 100)}% sensitivity
            </p>
          </div>
          <div>
            <Label>Alert Threshold</Label>
            <Slider
              value={[preferences.anomalyDetection.alertThreshold]}
              onValueChange={([value]) => updatePreference('anomalyDetection', 'alertThreshold', value)}
              min={0.1}
              max={1.0}
              step={0.1}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              {Math.round(preferences.anomalyDetection.alertThreshold * 100)}% threshold
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Confidence Scores</Label>
              <p className="text-sm text-gray-600">Display confidence scores for anomalies</p>
            </div>
            <Switch
              checked={preferences.anomalyDetection.showConfidence}
              onCheckedChange={(checked) => updatePreference('anomalyDetection', 'showConfidence', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Predictive Analytics Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Predictive Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Forecast Horizon (hours)</Label>
              <Input
                type="number"
                value={preferences.predictiveAnalytics.forecastHorizon}
                onChange={(e) => updatePreference('predictiveAnalytics', 'forecastHorizon', parseInt(e.target.value))}
                min={1}
                max={168}
              />
            </div>
            <div>
              <Label>Confidence Level</Label>
              <Slider
                value={[preferences.predictiveAnalytics.confidenceLevel]}
                onValueChange={([value]) => updatePreference('predictiveAnalytics', 'confidenceLevel', value)}
                min={0.8}
                max={0.99}
                step={0.01}
                className="mt-2"
              />
              <p className="text-sm text-gray-600 mt-1">
                {Math.round(preferences.predictiveAnalytics.confidenceLevel * 100)}% confidence
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Trends</Label>
              <p className="text-sm text-gray-600">Display trend analysis in predictions</p>
            </div>
            <Switch
              checked={preferences.predictiveAnalytics.showTrends}
              onCheckedChange={(checked) => updatePreference('predictiveAnalytics', 'showTrends', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Risk Threshold</Label>
            <Slider
              value={[preferences.security.riskThreshold]}
              onValueChange={([value]) => updatePreference('security', 'riskThreshold', value)}
              min={0.1}
              max={1.0}
              step={0.1}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              {Math.round(preferences.security.riskThreshold * 100)}% risk threshold
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Threat Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications for security threats</p>
              </div>
              <Switch
                checked={preferences.security.threatNotifications}
                onCheckedChange={(checked) => updatePreference('security', 'threatNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Audit Logging</Label>
                <p className="text-sm text-gray-600">Enable comprehensive audit logging</p>
              </div>
              <Switch
                checked={preferences.security.auditLogging}
                onCheckedChange={(checked) => updatePreference('security', 'auditLogging', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Performance Monitoring</Label>
                <p className="text-sm text-gray-600">Enable performance monitoring</p>
              </div>
              <Switch
                checked={preferences.performance.monitoringEnabled}
                onCheckedChange={(checked) => updatePreference('performance', 'monitoringEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Resource Optimization</Label>
                <p className="text-sm text-gray-600">Enable automatic resource optimization</p>
              </div>
              <Switch
                checked={preferences.performance.resourceOptimization}
                onCheckedChange={(checked) => updatePreference('performance', 'resourceOptimization', checked)}
              />
            </div>
          </div>
          <div>
            <Label>Alert Threshold</Label>
            <Slider
              value={[preferences.performance.alertThreshold]}
              onValueChange={([value]) => updatePreference('performance', 'alertThreshold', value)}
              min={0.1}
              max={1.0}
              step={0.1}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              {Math.round(preferences.performance.alertThreshold * 100)}% threshold
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Export Format</Label>
              <Select
                value={preferences.export.defaultFormat}
                onValueChange={(value) => updatePreference('export', 'defaultFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Retention Period (days)</Label>
              <Input
                type="number"
                value={preferences.export.retentionPeriod}
                onChange={(e) => updatePreference('export', 'retentionPeriod', parseInt(e.target.value))}
                min={1}
                max={365}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Metadata</Label>
                <p className="text-sm text-gray-600">Include metadata in exports</p>
              </div>
              <Switch
                checked={preferences.export.includeMetadata}
                onCheckedChange={(checked) => updatePreference('export', 'includeMetadata', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Compression</Label>
                <p className="text-sm text-gray-600">Compress export files</p>
              </div>
              <Switch
                checked={preferences.export.compressionEnabled}
                onCheckedChange={(checked) => updatePreference('export', 'compressionEnabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <Switch
                checked={preferences.notifications.email}
                onCheckedChange={(checked) => updatePreference('notifications', 'email', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Slack Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications via Slack</p>
              </div>
              <Switch
                checked={preferences.notifications.slack}
                onCheckedChange={(checked) => updatePreference('notifications', 'slack', checked)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>In-App Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications in the app</p>
              </div>
              <Switch
                checked={preferences.notifications.inApp}
                onCheckedChange={(checked) => updatePreference('notifications', 'inApp', checked)}
              />
            </div>
            <div>
              <Label>Notification Frequency</Label>
              <Select
                value={preferences.notifications.frequency}
                onValueChange={(value) => updatePreference('notifications', 'frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Quiet Hours</Label>
              <p className="text-sm text-gray-600">Suppress notifications during quiet hours</p>
            </div>
            <Switch
              checked={preferences.notifications.quietHours.enabled}
              onCheckedChange={(checked) => updatePreference('notifications', 'quietHours', {
                ...preferences.notifications.quietHours,
                enabled: checked
              })}
            />
          </div>
          {preferences.notifications.quietHours.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Quiet Hours Start</Label>
                <Input
                  type="time"
                  value={preferences.notifications.quietHours.start}
                  onChange={(e) => updatePreference('notifications', 'quietHours', {
                    ...preferences.notifications.quietHours,
                    start: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Quiet Hours End</Label>
                <Input
                  type="time"
                  value={preferences.notifications.quietHours.end}
                  onChange={(e) => updatePreference('notifications', 'quietHours', {
                    ...preferences.notifications.quietHours,
                    end: e.target.value
                  })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
