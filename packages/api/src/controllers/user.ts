import { userService } from '@/services/UserService';
import { User } from '@/entities/User';

export async function findUserByAccessKey(accessKey: string): Promise<User | null> {
  // TODO: Implement accessKey functionality in UserService
  // For now, return null to indicate user not found
  return null;
}

export async function findUserById(id: string) {
  return userService.findById(id);
}

export async function findUserByEmail(email: string) {
  return userService.findByEmail(email);
}

export async function findUserByEmailInTeam(
  email: string,
  teamId: string,
) {
  const user = await userService.findByEmail(email);
  return user && user.teamId === teamId ? user : null;
}

export async function findUsersByTeam(teamId: string) {
  return userService.findByTeamId(teamId);
}

export async function deleteTeamMember(teamId: string, userId: string) {
  const user = await userService.findById(userId);
  if (user && user.teamId === teamId) {
    return userService.deleteUser(userId);
  }
  return false;
}
