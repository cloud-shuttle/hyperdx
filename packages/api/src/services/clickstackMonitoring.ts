import { client } from '@/clickhouse';

interface MonitoringConfig {
  enabled: boolean;
  metrics: {
    collection: boolean;
    storage: boolean;
    retention: string;
  };
  logs: {
    collection: boolean;
    storage: boolean;
    retention: string;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  alerts: {
    enabled: boolean;
    channels: string[];
    thresholds: {
      cpu: number;
      memory: number;
      disk: number;
      responseTime: number;
      errorRate: number;
    };
  };
  dashboards: {
    enabled: boolean;
    refreshInterval: number;
    retention: string;
  };
}

interface MetricData {
  timestamp: string;
  service: string;
  metric: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: string[];
  cooldown: number;
  lastTriggered?: string;
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

interface PerformanceMetrics {
  service: string;
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeConnections: number;
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
  comments: SupportComment[];
}

interface SupportComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isInternal: boolean;
}

interface EscalationProcedure {
  level: number;
  name: string;
  description: string;
  timeToEscalate: number;
  contacts: string[];
  actions: string[];
}

export class ClickStackMonitoringService {
  private static instance: ClickStackMonitoringService;
  private config: MonitoringConfig;
  private alertRules: Map<string, AlertRule>;
  private activeAlerts: Map<string, Alert>;
  private supportTickets: Map<string, SupportTicket>;
  private escalationProcedures: EscalationProcedure[];
  private metricsBuffer: MetricData[];
  private performanceMetrics: Map<string, PerformanceMetrics>;

  private constructor() {
    this.config = this.loadDefaultConfig();
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.supportTickets = new Map();
    this.escalationProcedures = this.loadEscalationProcedures();
    this.metricsBuffer = [];
    this.performanceMetrics = new Map();
    
    this.initializeMonitoring();
  }

  public static getInstance(): ClickStackMonitoringService {
    if (!ClickStackMonitoringService.instance) {
      ClickStackMonitoringService.instance = new ClickStackMonitoringService();
    }
    return ClickStackMonitoringService.instance;
  }

  private loadDefaultConfig(): MonitoringConfig {
    return {
      enabled: true,
      metrics: {
        collection: true,
        storage: true,
        retention: '30d',
      },
      logs: {
        collection: true,
        storage: true,
        retention: '90d',
        level: 'info',
      },
      alerts: {
        enabled: true,
        channels: ['email', 'slack', 'webhook'],
        thresholds: {
          cpu: 80,
          memory: 85,
          disk: 90,
          responseTime: 1000,
          errorRate: 5,
        },
      },
      dashboards: {
        enabled: true,
        refreshInterval: 30,
        retention: '7d',
      },
    };
  }

  private loadEscalationProcedures(): EscalationProcedure[] {
    return [
      {
        level: 1,
        name: 'Initial Response',
        description: 'Automated alert and initial investigation',
        timeToEscalate: 15, // minutes
        contacts: ['oncall@hyperdx.com'],
        actions: [
          'Send automated alert',
          'Check service status',
          'Review recent changes',
          'Update status page',
        ],
      },
      {
        level: 2,
        name: 'Technical Investigation',
        description: 'Technical team investigation and resolution',
        timeToEscalate: 30, // minutes
        contacts: ['tech-lead@hyperdx.com', 'devops@hyperdx.com'],
        actions: [
          'Technical investigation',
          'Log analysis',
          'Performance analysis',
          'Root cause identification',
        ],
      },
      {
        level: 3,
        name: 'Management Escalation',
        description: 'Management involvement and coordination',
        timeToEscalate: 60, // minutes
        contacts: ['engineering-manager@hyperdx.com', 'cto@hyperdx.com'],
        actions: [
          'Management coordination',
          'Customer communication',
          'Resource allocation',
          'External support coordination',
        ],
      },
      {
        level: 4,
        name: 'Executive Escalation',
        description: 'Executive level involvement and decision making',
        timeToEscalate: 120, // minutes
        contacts: ['ceo@hyperdx.com', 'cto@hyperdx.com'],
        actions: [
          'Executive decision making',
          'Customer escalation',
          'External vendor coordination',
          'Public communication',
        ],
      },
    ];
  }

  private async initializeMonitoring(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Initialize alert rules
    await this.initializeAlertRules();

    // Start metrics collection
    if (this.config.metrics.collection) {
      this.startMetricsCollection();
    }

    // Start log collection
    if (this.config.logs.collection) {
      this.startLogCollection();
    }

    // Start alert monitoring
    if (this.config.alerts.enabled) {
      this.startAlertMonitoring();
    }

    console.log('ClickStack monitoring initialized');
  }

  private async initializeAlertRules(): Promise<void> {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        description: 'CPU usage exceeds threshold',
        condition: 'cpu > threshold',
        threshold: this.config.alerts.thresholds.cpu,
        severity: 'high',
        enabled: true,
        channels: this.config.alerts.channels,
        cooldown: 300, // 5 minutes
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds threshold',
        condition: 'memory > threshold',
        threshold: this.config.alerts.thresholds.memory,
        severity: 'high',
        enabled: true,
        channels: this.config.alerts.channels,
        cooldown: 300,
      },
      {
        id: 'high-disk-usage',
        name: 'High Disk Usage',
        description: 'Disk usage exceeds threshold',
        condition: 'disk > threshold',
        threshold: this.config.alerts.thresholds.disk,
        severity: 'critical',
        enabled: true,
        channels: this.config.alerts.channels,
        cooldown: 300,
      },
      {
        id: 'high-response-time',
        name: 'High Response Time',
        description: 'API response time exceeds threshold',
        condition: 'responseTime > threshold',
        threshold: this.config.alerts.thresholds.responseTime,
        severity: 'medium',
        enabled: true,
        channels: this.config.alerts.channels,
        cooldown: 300,
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds threshold',
        condition: 'errorRate > threshold',
        threshold: this.config.alerts.thresholds.errorRate,
        severity: 'critical',
        enabled: true,
        channels: this.config.alerts.channels,
        cooldown: 300,
      },
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  private startMetricsCollection(): void {
    setInterval(async () => {
      await this.collectMetrics();
    }, 30000); // Collect metrics every 30 seconds
  }

  private startLogCollection(): void {
    setInterval(async () => {
      await this.collectLogs();
    }, 10000); // Collect logs every 10 seconds
  }

  private startAlertMonitoring(): void {
    setInterval(async () => {
      await this.checkAlertConditions();
    }, 15000); // Check alerts every 15 seconds
  }

  private async collectMetrics(): Promise<void> {
    try {
      const services = ['api', 'app', 'clickhouse', 'otel-collector'];
      
      for (const service of services) {
        const metrics = await this.getServiceMetrics(service);
        this.metricsBuffer.push(...metrics);
        
        // Store performance metrics
        const performanceMetric: PerformanceMetrics = {
          service,
          timestamp: new Date().toISOString(),
          cpu: metrics.find(m => m.metric === 'cpu')?.value || 0,
          memory: metrics.find(m => m.metric === 'memory')?.value || 0,
          disk: metrics.find(m => m.metric === 'disk')?.value || 0,
          responseTime: metrics.find(m => m.metric === 'response_time')?.value || 0,
          throughput: metrics.find(m => m.metric === 'throughput')?.value || 0,
          errorRate: metrics.find(m => m.metric === 'error_rate')?.value || 0,
          activeConnections: metrics.find(m => m.metric === 'active_connections')?.value || 0,
        };

        this.performanceMetrics.set(service, performanceMetric);
      }

      // Store metrics in ClickHouse if buffer is full
      if (this.metricsBuffer.length >= 100) {
        await this.storeMetrics();
      }
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private async getServiceMetrics(service: string): Promise<MetricData[]> {
    // This would collect actual metrics from the service
    // For now, we'll simulate metrics
    const now = new Date().toISOString();
    return [
      {
        timestamp: now,
        service,
        metric: 'cpu',
        value: Math.random() * 100,
        unit: 'percent',
        tags: { service },
      },
      {
        timestamp: now,
        service,
        metric: 'memory',
        value: Math.random() * 100,
        unit: 'percent',
        tags: { service },
      },
      {
        timestamp: now,
        service,
        metric: 'disk',
        value: Math.random() * 100,
        unit: 'percent',
        tags: { service },
      },
      {
        timestamp: now,
        service,
        metric: 'response_time',
        value: Math.random() * 1000,
        unit: 'milliseconds',
        tags: { service },
      },
      {
        timestamp: now,
        service,
        metric: 'throughput',
        value: Math.random() * 1000,
        unit: 'requests_per_second',
        tags: { service },
      },
      {
        timestamp: now,
        service,
        metric: 'error_rate',
        value: Math.random() * 10,
        unit: 'percent',
        tags: { service },
      },
      {
        timestamp: now,
        service,
        metric: 'active_connections',
        value: Math.random() * 100,
        unit: 'connections',
        tags: { service },
      },
    ];
  }

  private async storeMetrics(): Promise<void> {
    try {
      // Store metrics in ClickHouse
      const metrics = this.metricsBuffer.splice(0);
      
      for (const metric of metrics) {
        await client.query({
          query: `
            INSERT INTO metric_stream (
              timestamp,
              service,
              metric,
              value,
              unit,
              tags
            ) VALUES (
              '${metric.timestamp}',
              '${metric.service}',
              '${metric.metric}',
              ${metric.value},
              '${metric.unit}',
              '${JSON.stringify(metric.tags)}'
            )
          `,
          format: 'JSON'
        });
      }
    } catch (error) {
      console.error('Error storing metrics:', error);
    }
  }

  private async collectLogs(): Promise<void> {
    try {
      // This would collect logs from various services
      // For now, we'll simulate log collection
      console.log('Log collection completed');
    } catch (error) {
      console.error('Error collecting logs:', error);
    }
  }

  private async checkAlertConditions(): Promise<void> {
    try {
      for (const [ruleId, rule] of this.alertRules) {
        if (!rule.enabled) continue;

        // Check if rule should trigger
        const shouldTrigger = await this.evaluateAlertCondition(rule);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule);
        }
      }
    } catch (error) {
      console.error('Error checking alert conditions:', error);
    }
  }

  private async evaluateAlertCondition(rule: AlertRule): Promise<boolean> {
    try {
      // Check cooldown period
      if (rule.lastTriggered) {
        const lastTriggered = new Date(rule.lastTriggered);
        const now = new Date();
        const timeSinceLastTrigger = (now.getTime() - lastTriggered.getTime()) / 1000;
        
        if (timeSinceLastTrigger < rule.cooldown) {
          return false;
        }
      }

      // Evaluate condition based on current metrics
      const currentMetrics = Array.from(this.performanceMetrics.values());
      
      for (const metric of currentMetrics) {
        let shouldTrigger = false;
        
        switch (rule.id) {
          case 'high-cpu-usage':
            shouldTrigger = metric.cpu > rule.threshold;
            break;
          case 'high-memory-usage':
            shouldTrigger = metric.memory > rule.threshold;
            break;
          case 'high-disk-usage':
            shouldTrigger = metric.disk > rule.threshold;
            break;
          case 'high-response-time':
            shouldTrigger = metric.responseTime > rule.threshold;
            break;
          case 'high-error-rate':
            shouldTrigger = metric.errorRate > rule.threshold;
            break;
        }

        if (shouldTrigger) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error evaluating alert condition:', error);
      return false;
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    try {
      const alert: Alert = {
        id: `alert-${Date.now()}`,
        ruleId: rule.id,
        severity: rule.severity,
        message: `${rule.name}: ${rule.description}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false,
        details: {
          rule,
          currentMetrics: Array.from(this.performanceMetrics.values()),
        },
      };

      this.activeAlerts.set(alert.id, alert);
      rule.lastTriggered = new Date().toISOString();

      // Send alert notifications
      await this.sendAlertNotifications(alert);

      console.log(`Alert triggered: ${alert.message}`);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  private async sendAlertNotifications(alert: Alert): Promise<void> {
    try {
      const rule = this.alertRules.get(alert.ruleId);
      if (!rule) return;

      for (const channel of rule.channels) {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alert);
            break;
          case 'slack':
            await this.sendSlackAlert(alert);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert);
            break;
        }
      }
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // This would send email alerts
    console.log(`Email alert sent: ${alert.message}`);
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    // This would send Slack alerts
    console.log(`Slack alert sent: ${alert.message}`);
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    // This would send webhook alerts
    console.log(`Webhook alert sent: ${alert.message}`);
  }

  async getConfig(): Promise<MonitoringConfig> {
    return this.config;
  }

  async updateConfig(updates: Partial<MonitoringConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    console.log('Monitoring configuration updated', { updates });
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return Array.from(this.alertRules.values());
  }

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    const id = `rule-${Date.now()}`;
    const newRule: AlertRule = { ...rule, id };
    this.alertRules.set(id, newRule);
    return id;
  }

  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<void> {
    const rule = this.alertRules.get(id);
    if (!rule) {
      throw new Error(`Alert rule not found: ${id}`);
    }

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(id, updatedRule);
  }

  async deleteAlertRule(id: string): Promise<void> {
    this.alertRules.delete(id);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values());
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    this.activeAlerts.delete(alertId);
  }

  async getPerformanceMetrics(service?: string): Promise<PerformanceMetrics[]> {
    if (service) {
      const metric = this.performanceMetrics.get(service);
      return metric ? [metric] : [];
    }
    return Array.from(this.performanceMetrics.values());
  }

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): Promise<string> {
    const id = `ticket-${Date.now()}`;
    const now = new Date().toISOString();
    
    const newTicket: SupportTicket = {
      ...ticket,
      id,
      createdAt: now,
      updatedAt: now,
      comments: [],
    };

    this.supportTickets.set(id, newTicket);
    return id;
  }

  async getSupportTickets(status?: string): Promise<SupportTicket[]> {
    const tickets = Array.from(this.supportTickets.values());
    if (status) {
      return tickets.filter(ticket => ticket.status === status);
    }
    return tickets;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<void> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) {
      throw new Error(`Support ticket not found: ${id}`);
    }

    const updatedTicket = { 
      ...ticket, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.supportTickets.set(id, updatedTicket);
  }

  async addSupportComment(ticketId: string, comment: Omit<SupportComment, 'id' | 'timestamp'>): Promise<void> {
    const ticket = this.supportTickets.get(ticketId);
    if (!ticket) {
      throw new Error(`Support ticket not found: ${ticketId}`);
    }

    const newComment: SupportComment = {
      ...comment,
      id: `comment-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    ticket.comments.push(newComment);
    ticket.updatedAt = new Date().toISOString();
  }

  async getEscalationProcedures(): Promise<EscalationProcedure[]> {
    return this.escalationProcedures;
  }

  async escalateIssue(alertId: string, level: number): Promise<void> {
    const procedure = this.escalationProcedures.find(p => p.level === level);
    if (!procedure) {
      throw new Error(`Escalation procedure not found for level: ${level}`);
    }

    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    console.log(`Escalating issue to level ${level}: ${procedure.name}`);
    console.log(`Contacts: ${procedure.contacts.join(', ')}`);
    console.log(`Actions: ${procedure.actions.join(', ')}`);

    // This would trigger the escalation procedure
    // For now, we'll just log the escalation
  }

  async getDashboardData(): Promise<any> {
    return {
      metrics: {
        totalAlerts: this.activeAlerts.size,
        totalTickets: this.supportTickets.size,
        openTickets: Array.from(this.supportTickets.values()).filter(t => t.status === 'open').length,
        performanceMetrics: Array.from(this.performanceMetrics.values()),
      },
      alerts: Array.from(this.activeAlerts.values()),
      tickets: Array.from(this.supportTickets.values()),
    };
  }
}

export const clickStackMonitoringService = ClickStackMonitoringService.getInstance();
