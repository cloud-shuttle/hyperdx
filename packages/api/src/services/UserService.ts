import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/UserRepository';
import { User } from '@/entities/User';

export class UserService {
  async findById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return userRepository.findByEmail(email);
  }

  async findByTeamId(teamId: string): Promise<User[]> {
    return userRepository.findByTeamId(teamId);
  }

  async createUser(userData: {
    email: string;
    password?: string;
    name: string;
    teamId: string;
    isAdmin?: boolean;
    avatar?: string;
  }): Promise<User> {
    const hashedPassword = userData.password 
      ? await bcrypt.hash(userData.password, 10)
      : undefined;

    return userRepository.create({
      ...userData,
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    userData.updatedAt = new Date();
    return userRepository.update(id, userData);
  }

  async deleteUser(id: string): Promise<boolean> {
    return userRepository.delete(id);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  async updateLastLogin(id: string): Promise<void> {
    await userRepository.updateLastLogin(id);
  }

  async findAdminsByTeamId(teamId: string): Promise<User[]> {
    return userRepository.findAdminsByTeamId(teamId);
  }

  async findActiveUsersByTeamId(teamId: string): Promise<User[]> {
    return userRepository.findActiveUsersByTeamId(teamId);
  }

  async deactivateUser(id: string): Promise<User | null> {
    return userRepository.update(id, { 
      isActive: false, 
      updatedAt: new Date() 
    });
  }

  async activateUser(id: string): Promise<User | null> {
    return userRepository.update(id, { 
      isActive: true, 
      updatedAt: new Date() 
    });
  }
}

// Export singleton instance
export const userService = new UserService();
