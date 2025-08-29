import { Repository } from 'typeorm';
import { AppDataSource } from '@/database/postgres';
import { Team } from '@/entities/Team';

export class TeamRepository {
  private repository: Repository<Team>;

  constructor() {
    this.repository = AppDataSource.getRepository(Team);
  }

  async findById(id: string): Promise<Team | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTenantId(tenantId: string): Promise<Team | null> {
    return this.repository.findOne({ where: { tenantId } });
  }

  async findByApiKey(apiKey: string): Promise<Team | null> {
    return this.repository.findOne({ where: { apiKey } });
  }

  async findByHookId(hookId: string): Promise<Team | null> {
    return this.repository.findOne({ where: { hookId } });
  }

  async create(teamData: Partial<Team>): Promise<Team> {
    const team = this.repository.create(teamData);
    return this.repository.save(team);
  }

  async update(id: string, teamData: Partial<Team>): Promise<Team | null> {
    await this.repository.update(id, teamData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async findAll(): Promise<Team[]> {
    return this.repository.find();
  }

  async findActiveTeams(): Promise<Team[]> {
    return this.repository.find({ 
      where: { 
        isActive: true 
      } 
    });
  }

  async updateApiKey(id: string, apiKey: string): Promise<void> {
    await this.repository.update(id, { apiKey });
  }

  async updateHookId(id: string, hookId: string): Promise<void> {
    await this.repository.update(id, { hookId });
  }
}

// Export singleton instance
export const teamRepository = new TeamRepository();
