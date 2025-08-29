import { Repository } from 'typeorm';
import { AppDataSource } from '@/database/postgres';
import { Alert } from '@/entities/Alert';

export class AlertRepository {
  private repository: Repository<Alert>;

  constructor() {
    this.repository = AppDataSource.getRepository(Alert);
  }

  async findById(id: string): Promise<Alert | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTeamId(teamId: string): Promise<Alert[]> {
    return this.repository.find({ 
      where: { teamId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByTenantId(tenantId: string): Promise<Alert[]> {
    return this.repository
      .createQueryBuilder('alert')
      .innerJoin('alert.team', 'team')
      .where('team.tenantId = :tenantId', { tenantId })
      .orderBy('alert.createdAt', 'DESC')
      .getMany();
  }

  async findActiveAlertsByTeamId(teamId: string): Promise<Alert[]> {
    return this.repository.find({ 
      where: { 
        teamId, 
        isEnabled: true 
      } 
    });
  }

  async findByDashboardId(dashboardId: string): Promise<Alert[]> {
    return this.repository.find({ where: { dashboardId } });
  }

  async findBySavedSearchId(savedSearchId: string): Promise<Alert[]> {
    return this.repository.find({ where: { savedSearchId } });
  }

  async create(alertData: Partial<Alert>): Promise<Alert> {
    const alert = this.repository.create(alertData);
    return this.repository.save(alert);
  }

  async update(id: string, alertData: Partial<Alert>): Promise<Alert | null> {
    await this.repository.update(id, alertData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async findEnabledAlerts(): Promise<Alert[]> {
    return this.repository.find({ 
      where: { 
        isEnabled: true 
      } 
    });
  }

  async updateLastTriggered(id: string): Promise<void> {
    await this.repository.update(id, { 
      lastTriggeredAt: new Date() 
    });
  }

  async incrementTriggerCount(id: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Alert)
      .set({ 
        triggerCount: () => 'trigger_count + 1' 
      })
      .where('id = :id', { id })
      .execute();
  }
}

// Export singleton instance
export const alertRepository = new AlertRepository();
