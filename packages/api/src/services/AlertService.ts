import { alertRepository } from '@/repositories/AlertRepository';
import { Alert } from '@/entities/Alert';

export class AlertService {
  async findById(id: string): Promise<Alert | null> {
    return alertRepository.findById(id);
  }

  async findByTeamId(teamId: string): Promise<Alert[]> {
    return alertRepository.findByTeamId(teamId);
  }

  async findActiveAlertsByTeamId(teamId: string): Promise<Alert[]> {
    return alertRepository.findActiveAlertsByTeamId(teamId);
  }

  async findByDashboardId(dashboardId: string): Promise<Alert[]> {
    return alertRepository.findByDashboardId(dashboardId);
  }

  async findBySavedSearchId(savedSearchId: string): Promise<Alert[]> {
    return alertRepository.findBySavedSearchId(savedSearchId);
  }

  async createAlert(alertData: {
    name: string;
    teamId: string;
    source: 'logs' | 'traces' | 'metrics';
    type: 'count' | 'percentile' | 'custom';
    query: Record<string, any>;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    threshold: number;
    windowSizeInMinutes: number;
    dashboardId?: string;
    savedSearchId?: string;
    channels?: Array<{
      type: 'webhook' | 'slack' | 'email';
      config: Record<string, any>;
    }>;
  }): Promise<Alert> {
    return alertRepository.create({
      ...alertData,
      isEnabled: true,
      triggerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateAlert(id: string, alertData: Partial<Alert>): Promise<Alert | null> {
    alertData.updatedAt = new Date();
    return alertRepository.update(id, alertData);
  }

  async deleteAlert(id: string): Promise<boolean> {
    return alertRepository.delete(id);
  }

  async enableAlert(id: string): Promise<Alert | null> {
    return alertRepository.update(id, { 
      isEnabled: true, 
      updatedAt: new Date() 
    });
  }

  async disableAlert(id: string): Promise<Alert | null> {
    return alertRepository.update(id, { 
      isEnabled: false, 
      updatedAt: new Date() 
    });
  }

  async findEnabledAlerts(): Promise<Alert[]> {
    return alertRepository.findEnabledAlerts();
  }

  async updateLastTriggered(id: string): Promise<void> {
    await alertRepository.updateLastTriggered(id);
  }

  async incrementTriggerCount(id: string): Promise<void> {
    await alertRepository.incrementTriggerCount(id);
  }

  async triggerAlert(id: string): Promise<void> {
    await Promise.all([
      this.updateLastTriggered(id),
      this.incrementTriggerCount(id)
    ]);
  }

  async validateAlert(alert: Alert): Promise<boolean> {
    // Basic validation
    if (!alert.name || !alert.query || !alert.threshold) {
      return false;
    }

    // Validate operator
    const validOperators = ['>', '<', '>=', '<=', '==', '!='];
    if (!validOperators.includes(alert.operator)) {
      return false;
    }

    // Validate window size
    if (alert.windowSizeInMinutes <= 0) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const alertService = new AlertService();
