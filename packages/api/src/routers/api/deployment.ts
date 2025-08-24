import { Router } from 'express';
import { clickStackDeploymentService } from '@/services/clickstackDeployment';
import { clickStackMonitoringService } from '@/services/clickstackMonitoring';

const router = Router();

// Get deployment configuration
router.get('/config', async (req, res) => {
  try {
    const config = await clickStackDeploymentService.getConfig();
    res.json({ data: config });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get deployment configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update deployment configuration
router.put('/config', async (req, res) => {
  try {
    const updates = req.body;
    await clickStackDeploymentService.updateConfig(updates);
    res.json({ message: 'Deployment configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update deployment configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get deployment status
router.get('/status', async (req, res) => {
  try {
    const status = await clickStackDeploymentService.getDeploymentStatus();
    res.json({ data: status });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get deployment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start deployment
router.post('/deploy', async (req, res) => {
  try {
    const { environment } = req.body;
    
    if (!environment || !['staging', 'production'].includes(environment)) {
      return res.status(400).json({ 
        error: 'Invalid environment. Must be "staging" or "production"' 
      });
    }

    await clickStackDeploymentService.startDeployment(environment);
    res.json({ message: `Deployment to ${environment} started successfully` });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to start deployment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rollback deployment
router.post('/rollback', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ 
        error: 'Rollback reason is required' 
      });
    }

    await clickStackDeploymentService.rollbackDeployment(reason);
    res.json({ message: 'Deployment rollback completed successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to rollback deployment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get health checks
router.get('/health', async (req, res) => {
  try {
    const healthChecks = await clickStackDeploymentService.getHealthChecks();
    res.json({ data: healthChecks });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get health checks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get rollback history
router.get('/rollback-history', async (req, res) => {
  try {
    const rollbackHistory = await clickStackDeploymentService.getRollbackHistory();
    res.json({ data: rollbackHistory });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get rollback history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Scale services
router.post('/scale', async (req, res) => {
  try {
    const { replicas } = req.body;
    
    if (!replicas || typeof replicas !== 'number' || replicas < 1) {
      return res.status(400).json({ 
        error: 'Valid replicas count is required (minimum 1)' 
      });
    }

    await clickStackDeploymentService.scaleServices(replicas);
    res.json({ message: `Services scaled to ${replicas} replicas successfully` });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to scale services',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update services
router.post('/update', async (req, res) => {
  try {
    await clickStackDeploymentService.updateServices();
    res.json({ message: 'Services updated successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update services',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create backup
router.post('/backup', async (req, res) => {
  try {
    const backupId = await clickStackDeploymentService.backupData();
    res.json({ 
      message: 'Data backup created successfully',
      data: { backupId }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore from backup
router.post('/restore', async (req, res) => {
  try {
    const { backupId } = req.body;
    
    if (!backupId) {
      return res.status(400).json({ 
        error: 'Backup ID is required' 
      });
    }

    await clickStackDeploymentService.restoreData(backupId);
    res.json({ message: `Data restored from backup ${backupId} successfully` });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to restore data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Monitoring endpoints

// Get monitoring configuration
router.get('/monitoring/config', async (req, res) => {
  try {
    const config = await clickStackMonitoringService.getConfig();
    res.json({ data: config });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get monitoring configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update monitoring configuration
router.put('/monitoring/config', async (req, res) => {
  try {
    const updates = req.body;
    await clickStackMonitoringService.updateConfig(updates);
    res.json({ message: 'Monitoring configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update monitoring configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get alert rules
router.get('/monitoring/alerts/rules', async (req, res) => {
  try {
    const rules = await clickStackMonitoringService.getAlertRules();
    res.json({ data: rules });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get alert rules',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create alert rule
router.post('/monitoring/alerts/rules', async (req, res) => {
  try {
    const ruleData = req.body;
    const ruleId = await clickStackMonitoringService.createAlertRule(ruleData);
    res.json({ 
      message: 'Alert rule created successfully',
      data: { ruleId }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create alert rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update alert rule
router.put('/monitoring/alerts/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await clickStackMonitoringService.updateAlertRule(id, updates);
    res.json({ message: 'Alert rule updated successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update alert rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete alert rule
router.delete('/monitoring/alerts/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await clickStackMonitoringService.deleteAlertRule(id);
    res.json({ message: 'Alert rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete alert rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get active alerts
router.get('/monitoring/alerts', async (req, res) => {
  try {
    const alerts = await clickStackMonitoringService.getActiveAlerts();
    res.json({ data: alerts });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get active alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Acknowledge alert
router.post('/monitoring/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy } = req.body;
    
    if (!acknowledgedBy) {
      return res.status(400).json({ 
        error: 'Acknowledged by is required' 
      });
    }

    await clickStackMonitoringService.acknowledgeAlert(id, acknowledgedBy);
    res.json({ message: 'Alert acknowledged successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to acknowledge alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resolve alert
router.post('/monitoring/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    await clickStackMonitoringService.resolveAlert(id);
    res.json({ message: 'Alert resolved successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to resolve alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get performance metrics
router.get('/monitoring/metrics', async (req, res) => {
  try {
    const { service } = req.query;
    const metrics = await clickStackMonitoringService.getPerformanceMetrics(
      service as string
    );
    res.json({ data: metrics });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Support ticket endpoints

// Create support ticket
router.post('/support/tickets', async (req, res) => {
  try {
    const ticketData = req.body;
    const ticketId = await clickStackMonitoringService.createSupportTicket(ticketData);
    res.json({ 
      message: 'Support ticket created successfully',
      data: { ticketId }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create support ticket',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get support tickets
router.get('/support/tickets', async (req, res) => {
  try {
    const { status } = req.query;
    const tickets = await clickStackMonitoringService.getSupportTickets(
      status as string
    );
    res.json({ data: tickets });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get support tickets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update support ticket
router.put('/support/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await clickStackMonitoringService.updateSupportTicket(id, updates);
    res.json({ message: 'Support ticket updated successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update support ticket',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add support comment
router.post('/support/tickets/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const commentData = req.body;
    await clickStackMonitoringService.addSupportComment(id, commentData);
    res.json({ message: 'Comment added successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to add comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get escalation procedures
router.get('/support/escalation', async (req, res) => {
  try {
    const procedures = await clickStackMonitoringService.getEscalationProcedures();
    res.json({ data: procedures });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get escalation procedures',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Escalate issue
router.post('/support/escalate', async (req, res) => {
  try {
    const { alertId, level } = req.body;
    
    if (!alertId || !level) {
      return res.status(400).json({ 
        error: 'Alert ID and escalation level are required' 
      });
    }

    await clickStackMonitoringService.escalateIssue(alertId, level);
    res.json({ message: `Issue escalated to level ${level} successfully` });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to escalate issue',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get monitoring dashboard data
router.get('/monitoring/dashboard', async (req, res) => {
  try {
    const dashboardData = await clickStackMonitoringService.getDashboardData();
    res.json({ data: dashboardData });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Go-live endpoints

// Start go-live process
router.post('/go-live/start', async (req, res) => {
  try {
    const { environment, features } = req.body;
    
    if (!environment || !['staging', 'production'].includes(environment)) {
      return res.status(400).json({ 
        error: 'Invalid environment. Must be "staging" or "production"' 
      });
    }

    // Start deployment
    await clickStackDeploymentService.startDeployment(environment);
    
    // Enable monitoring
    await clickStackMonitoringService.updateConfig({ enabled: true });
    
    res.json({ 
      message: `Go-live process started for ${environment}`,
      data: { environment, features }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to start go-live process',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete go-live process
router.post('/go-live/complete', async (req, res) => {
  try {
    const { environment } = req.body;
    
    if (!environment) {
      return res.status(400).json({ 
        error: 'Environment is required' 
      });
    }

    // Final validation
    const status = await clickStackDeploymentService.getDeploymentStatus();
    if (status.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Deployment must be completed before go-live can be finalized' 
      });
    }

    // Enable all features
    await clickStackDeploymentService.updateConfig({
      features: {
        anomalyDetection: true,
        predictiveAnalytics: true,
        sessionReplay: true,
        patternRecognition: true,
        securityAnalysis: true,
      }
    });

    res.json({ 
      message: `Go-live process completed for ${environment}`,
      data: { environment, status: 'live' }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to complete go-live process',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get go-live status
router.get('/go-live/status', async (req, res) => {
  try {
    const deploymentStatus = await clickStackDeploymentService.getDeploymentStatus();
    const monitoringConfig = await clickStackMonitoringService.getConfig();
    const healthChecks = await clickStackDeploymentService.getHealthChecks();
    
    const goLiveStatus = {
      deployment: deploymentStatus,
      monitoring: monitoringConfig,
      health: healthChecks,
      isLive: deploymentStatus.status === 'completed' && monitoringConfig.enabled,
    };

    res.json({ data: goLiveStatus });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get go-live status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
