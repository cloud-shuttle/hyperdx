import { v4 as uuidv4 } from 'uuid';
import * as config from '@/config';
import { teamService } from '@/services/TeamService';
import { Team } from '@/entities/Team';

const LOCAL_APP_TEAM_ID = '_local_team_';
export const LOCAL_APP_TEAM = {
  id: LOCAL_APP_TEAM_ID,
  name: 'Local App Team',
  // Placeholder keys
  hookId: uuidv4(),
  apiKey: uuidv4(),
  collectorAuthenticationEnforced: false,
  toJSON() {
    return this;
  },
};

export async function isTeamExisting() {
  if (config.IS_LOCAL_APP_MODE) {
    return true;
  }

  const teams = await teamService.findAllTeams();
  return teams.length > 0;
}

export async function createTeam({
  name,
  collectorAuthenticationEnforced = true,
}: {
  name: string;
  collectorAuthenticationEnforced?: boolean;
}) {
  if (await isTeamExisting()) {
    throw new Error('Team already exists');
  }

  const tenantId = uuidv4();
  const team = await teamService.createTeam({
    name,
    tenantId,
    tenantName: name,
  });

  return team;
}

export async function getAllTeams(fields?: string[]) {
  if (config.IS_LOCAL_APP_MODE) {
    return [LOCAL_APP_TEAM];
  }

  return teamService.findAllTeams();
}

export async function getTeam(id?: string, fields?: string[]) {
  if (config.IS_LOCAL_APP_MODE) {
    return LOCAL_APP_TEAM;
  }

  if (!id) {
    const teams = await teamService.findAllTeams();
    return teams[0] || null;
  }

  return teamService.findById(id);
}

export async function getTeamByApiKey(apiKey: string) {
  if (config.IS_LOCAL_APP_MODE) {
    return LOCAL_APP_TEAM;
  }

  return teamService.findByApiKey(apiKey);
}

export async function rotateTeamApiKey(teamId: string) {
  return teamService.regenerateApiKey(teamId);
}

export async function setTeamName(teamId: string, name: string) {
  return teamService.updateTeam(teamId, { name });
}

export async function updateTeamClickhouseSettings(
  teamId: string,
  settings: any,
) {
  return teamService.updateTeam(teamId, settings);
}

export async function getTags(teamId: string) {
  // TODO: Implement tag aggregation for PostgreSQL
  // This will need to be implemented with proper SQL queries
  return [];
}
