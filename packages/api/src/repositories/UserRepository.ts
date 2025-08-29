import { Repository } from 'typeorm';
import { AppDataSource } from '@/database/postgres';
import { User } from '@/entities/User';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByTeamId(teamId: string): Promise<User[]> {
    return this.repository.find({ 
      where: { teamId },
      order: { createdAt: 'ASC' }
    });
  }

  async findByTenantId(tenantId: string): Promise<User[]> {
    return this.repository
      .createQueryBuilder('user')
      .innerJoin('user.team', 'team')
      .where('team.tenantId = :tenantId', { tenantId })
      .orderBy('user.createdAt', 'ASC')
      .getMany();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async findAdminsByTeamId(teamId: string): Promise<User[]> {
    return this.repository.find({ 
      where: { 
        teamId, 
        isAdmin: true 
      } 
    });
  }

  async findActiveUsersByTeamId(teamId: string): Promise<User[]> {
    return this.repository.find({ 
      where: { 
        teamId, 
        isActive: true 
      } 
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { 
      lastLoginAt: new Date() 
    });
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
