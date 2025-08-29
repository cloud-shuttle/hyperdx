import crypto from 'crypto';
import { teamRepository } from '@/repositories/TeamRepository';
import { Team } from '@/entities/Team';

export class TeamService {
  async findById(id: string): Promise<Team | null> {
    return teamRepository.findById(id);
  }

  async findByTenantId(tenantId: string): Promise<Team | null> {
    return teamRepository.findByTenantId(tenantId);
  }

  async findByApiKey(apiKey: string): Promise<Team | null> {
    return teamRepository.findByApiKey(apiKey);
  }

  async findByHookId(hookId: string): Promise<Team | null> {
    return teamRepository.findByHookId(hookId);
  }

  async createTeam(teamData: {
    name: string;
    tenantId: string;
    tenantName?: string;
    dataRetentionDays?: number;
    maxUsersPerTenant?: number;
    allowedIngestionRate?: number;
    storageQuotaGB?: number;
  }): Promise<Team> {
    const apiKey = this.generateApiKey();
    const hookId = this.generateHookId();

    return teamRepository.create({
      ...teamData,
      apiKey,
      hookId,
      collectorAuthenticationEnforced: false,
      dataRetentionDays: teamData.dataRetentionDays || 30,
      maxUsersPerTenant: teamData.maxUsersPerTenant || 10,
      allowedIngestionRate: teamData.allowedIngestionRate || 10000,
      storageQuotaGB: teamData.storageQuotaGB || 10,
      featuresEnabled: {},
      clickstackSettings: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateTeam(id: string, teamData: Partial<Team>): Promise<Team | null> {
    teamData.updatedAt = new Date();
    return teamRepository.update(id, teamData);
  }

  async deleteTeam(id: string): Promise<boolean> {
    return teamRepository.delete(id);
  }

  async regenerateApiKey(id: string): Promise<Team | null> {
    const newApiKey = this.generateApiKey();
    await teamRepository.updateApiKey(id, newApiKey);
    return this.findById(id);
  }

  async regenerateHookId(id: string): Promise<Team | null> {
    const newHookId = this.generateHookId();
    await teamRepository.updateHookId(id, newHookId);
    return this.findById(id);
  }

  async findAllTeams(): Promise<Team[]> {
    return teamRepository.findAll();
  }

  async findActiveTeams(): Promise<Team[]> {
    return teamRepository.findActiveTeams();
  }

  async deactivateTeam(id: string): Promise<Team | null> {
    return teamRepository.update(id, { 
      isActive: false, 
      updatedAt: new Date() 
    });
  }

  async activateTeam(id: string): Promise<Team | null> {
    return teamRepository.update(id, { 
      isActive: true, 
      updatedAt: new Date() 
    });
  }

  private generateApiKey(): string {
    return `hd_${crypto.randomBytes(32).toString('hex')}`;
  }

  private generateHookId(): string {
    return `hook_${crypto.randomBytes(16).toString('hex')}`;
  }
}

// Export singleton instance
export const teamService = new TeamService();
