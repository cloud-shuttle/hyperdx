import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Search, 
  Settings, 
  RefreshCw, 
  Zap,
  BarChart3,
  Cpu,
  HardDrive,
  Network,
  Target,
  Clock,
  Eye,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Users,
  Lock,
  Key,
  Bell,
  Database,
  Server,
  Globe,
  Monitor,
  Wrench,
  Lightbulb,
  TrendingDown,
  Minus,
  Plus,
  Filter,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

import { clickStackAdvancedService } from './ClickStackAdvancedService';

// API calls will be made directly to /api/clickstack/advanced endpoints

interface ClickStackAdvancedDashboardProps {
  teamId: string;
}

export const ClickStackAdvancedDashboard: React.FC<ClickStackAdvancedDashboardProps> = ({
  teamId,
}) => {
  const [activeTab, setActiveTab] = useState('anomalies');
  const [timeRange, setTimeRange] = useState('24h');
  const [config, setConfig] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [securityThreats, setSecurityThreats] = useState<any[]>([]);
  const [behavioralAnalyses, setBehavioralAnalyses] = useState<any[]>([]);
  const [rootCauseAnalyses, setRootCauseAnalyses] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch advanced data
  const fetchAdvancedData = async () => {
    try {
      const [currentConfig, currentAnomalies, currentPredictions, currentThreats, currentBehaviors, currentRCAs] = await Promise.all([
        clickStackAdvancedService.getConfig(),
        clickStackAdvancedService.getAnomalies(timeRange),
        clickStackAdvancedService.getPredictions(timeRange),
        clickStackAdvancedService.getSecurityThreats(timeRange),
        clickStackAdvancedService.getBehavioralAnalyses(timeRange),
        clickStackAdvancedService.getRootCauseAnalyses(timeRange)
      ]);

      setConfig(currentConfig);
      setAnomalies(currentAnomalies);
      setPredictions(currentPredictions);
      setSecurityThreats(currentThreats);
      setBehavioralAnalyses(currentBehaviors);
      setRootCauseAnalyses(currentRCAs);

    } catch (error) {
      console.error('Failed to fetch advanced data:', error);
    }
  };

  // Update configuration
  const updateConfig = async (updates: any) => {
    try {
      await clickStackAdvancedService.updateConfig(updates);
      await fetchAdvancedData();
    } catch (error) {
      console.error('Failed to update configuration:', error);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get behavior color
  const getBehaviorColor = (behavior: string) => {
    switch (behavior) {
      case 'malicious': return 'text-red-600 bg-red-50 border-red-200';
      case 'suspicious': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Format confidence
  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  useEffect(() => {
    fetchAdvancedData();
    const interval = setInterval(fetchAdvancedData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [teamId, timeRange, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>ClickStack Advanced Features</span>
                <Badge variant="outline">ML-Powered</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Machine learning-powered anomaly detection, predictive analytics, and advanced security
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Anomalies</p>
                <p className="text-2xl font-bold text-gray-900">{anomalies.length}</p>
                <p className="text-sm text-gray-500">
                  {anomalies.filter(a => a.severity === 'critical').length} critical
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Predictions</p>
                <p className="text-2xl font-bold text-gray-900">{predictions.length}</p>
                <p className="text-sm text-gray-500">
                  {predictions.filter(p => p.impact === 'high').length} high impact
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Security Threats</p>
                <p className="text-2xl font-bold text-gray-900">{securityThreats.length}</p>
                <p className="text-sm text-gray-500">
                  {securityThreats.filter(t => t.severity === 'critical').length} critical
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Root Cause Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{rootCauseAnalyses.length}</p>
                <p className="text-sm text-gray-500">
                  {rootCauseAnalyses.filter(r => r.impact === 'high').length} high impact
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Advanced Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>ML-Powered Anomaly Detection</span>
                <Badge variant="outline">{anomalies.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No anomalies detected</p>
                ) : (
                  anomalies.map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getSeverityIcon(anomaly.severity)}
                          <div>
                            <h4 className="text-sm font-medium">{anomaly.description}</h4>
                            <p className="text-xs text-gray-600">
                              {anomaly.service} • {anomaly.metric}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {anomaly.severity}
                          </Badge>
                          <p className="text-xs text-gray-600">
                            Score: {anomaly.anomalyScore.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Current Value</p>
                          <p className="text-sm font-semibold">{anomaly.value}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Baseline</p>
                          <p className="text-sm font-semibold">{anomaly.baseline.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Confidence</p>
                          <p className="text-sm font-semibold">{formatConfidence(anomaly.confidence)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Time</p>
                          <p className="text-sm font-semibold">
                            {new Date(anomaly.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Recommendations:</p>
                        <ul className="text-xs space-y-1">
                          {anomaly.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-center space-x-2">
                              <Lightbulb className="h-3 w-3 text-yellow-500" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Predictive Analytics</span>
                <Badge variant="outline">{predictions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No predictions available</p>
                ) : (
                  predictions.map((prediction) => (
                    <div key={prediction.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Brain className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="text-sm font-medium">
                              {prediction.service} {prediction.metric} Prediction
                            </h4>
                            <p className="text-xs text-gray-600">
                              Forecast: {prediction.timeframe}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {prediction.impact} impact
                          </Badge>
                          <p className="text-xs text-gray-600">
                            Confidence: {formatConfidence(prediction.confidence)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Current</p>
                          <p className="text-sm font-semibold">{prediction.currentValue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Predicted</p>
                          <p className="text-sm font-semibold">{prediction.predictedValue.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Trend</p>
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(prediction.trend)}
                            <span className="text-sm font-semibold capitalize">{prediction.trend}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Time</p>
                          <p className="text-sm font-semibold">
                            {new Date(prediction.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Recommendations:</p>
                        <ul className="text-xs space-y-1">
                          {prediction.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-center space-x-2">
                              <Target className="h-3 w-3 text-blue-500" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Threats</span>
                  <Badge variant="outline">{securityThreats.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityThreats.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No security threats detected</p>
                  ) : (
                    securityThreats.map((threat) => (
                      <div
                        key={threat.id}
                        className={`p-3 rounded-lg border ${getSeverityColor(threat.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{threat.description}</h4>
                            <p className="text-xs text-gray-600">
                              {threat.threatType} • {threat.source} → {threat.target}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Risk Score: {(threat.riskScore * 100).toFixed(1)}%
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {threat.severity}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Behavioral Analysis</span>
                  <Badge variant="outline">{behavioralAnalyses.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {behavioralAnalyses.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No behavioral analysis available</p>
                  ) : (
                    behavioralAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className={`p-3 rounded-lg border ${getBehaviorColor(analysis.behavior)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">
                              User {analysis.userId} - {analysis.behavior}
                            </h4>
                            <p className="text-xs text-gray-600">
                              Session: {analysis.sessionId}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Risk Score: {(analysis.riskScore * 100).toFixed(1)}%
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {analysis.behavior}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Root Cause Analysis</span>
                <Badge variant="outline">{rootCauseAnalyses.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rootCauseAnalyses.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No root cause analyses available</p>
                ) : (
                  rootCauseAnalyses.map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Search className="h-5 w-5 text-purple-600" />
                          <div>
                            <h4 className="text-sm font-medium">{analysis.rootCause}</h4>
                            <p className="text-xs text-gray-600">
                              Incident: {analysis.incidentId} • Service: {analysis.service}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {analysis.impact} impact
                          </Badge>
                          <p className="text-xs text-gray-600">
                            Confidence: {formatConfidence(analysis.confidence)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Contributing Factors:</p>
                          <ul className="text-xs space-y-1">
                            {analysis.contributingFactors.map((factor: string, index: number) => (
                              <li key={index} className="flex items-center space-x-2">
                                <AlertCircle className="h-3 w-3 text-orange-500" />
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Prevention:</p>
                          <ul className="text-xs space-y-1">
                            {analysis.prevention.map((prevention: string, index: number) => (
                              <li key={index} className="flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{prevention}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Resolution:</p>
                        <p className="text-xs text-gray-600">{analysis.resolution}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Anomaly Detection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {config?.anomalyDetection && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Enabled</span>
                      <Switch
                        checked={config.anomalyDetection.enabled}
                        onCheckedChange={(checked) => updateConfig({ 
                          anomalyDetection: { ...config.anomalyDetection, enabled: checked } 
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm">Algorithm</label>
                      <Select 
                        value={config.anomalyDetection.algorithm}
                        onValueChange={(value) => updateConfig({ 
                          anomalyDetection: { ...config.anomalyDetection, algorithm: value } 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="isolation_forest">Isolation Forest</SelectItem>
                          <SelectItem value="dbscan">DBSCAN</SelectItem>
                          <SelectItem value="lof">Local Outlier Factor</SelectItem>
                          <SelectItem value="autoencoder">Autoencoder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm">Sensitivity: {config.anomalyDetection.sensitivity}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={config.anomalyDetection.sensitivity}
                        onChange={(e) => updateConfig({ 
                          anomalyDetection: { ...config.anomalyDetection, sensitivity: parseFloat(e.target.value) } 
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm">Threshold: {config.anomalyDetection.threshold}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={config.anomalyDetection.threshold}
                        onChange={(e) => updateConfig({ 
                          anomalyDetection: { ...config.anomalyDetection, threshold: parseFloat(e.target.value) } 
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Predictive Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {config?.predictiveAnalytics && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Enabled</span>
                      <Switch
                        checked={config.predictiveAnalytics.enabled}
                        onCheckedChange={(checked) => updateConfig({ 
                          predictiveAnalytics: { ...config.predictiveAnalytics, enabled: checked } 
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm">Forecast Horizon (hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={config.predictiveAnalytics.forecastHorizon}
                        onChange={(e) => updateConfig({ 
                          predictiveAnalytics: { ...config.predictiveAnalytics, forecastHorizon: parseInt(e.target.value) } 
                        })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm">Confidence Level: {formatConfidence(config.predictiveAnalytics.confidenceLevel)}</label>
                      <input
                        type="range"
                        min="0.8"
                        max="0.99"
                        step="0.01"
                        value={config.predictiveAnalytics.confidenceLevel}
                        onChange={(e) => updateConfig({ 
                          predictiveAnalytics: { ...config.predictiveAnalytics, confidenceLevel: parseFloat(e.target.value) } 
                        })}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Models:</p>
                      {Object.entries(config.predictiveAnalytics.models).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs capitalize">{key.replace('_', ' ')}</span>
                          <Switch
                            checked={value as boolean}
                            onCheckedChange={(checked) => updateConfig({ 
                              predictiveAnalytics: { 
                                ...config.predictiveAnalytics, 
                                models: { ...config.predictiveAnalytics.models, [key]: checked } 
                              } 
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
