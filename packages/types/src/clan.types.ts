export enum ClanRole {
  MEMBER = 'MEMBER',
  OFFICER = 'OFFICER',
  CO_LEADER = 'CO_LEADER',
  LEADER = 'LEADER',
}

export enum ClanWarStatus {
  PREPARING = 'PREPARING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TournamentStatus {
  UPCOMING = 'UPCOMING',
  REGISTRATION = 'REGISTRATION',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Clan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  level: number;
  xp: bigint;
  ownerId: string;
  memberLimit: number;
  isPublic: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClanMember {
  id: string;
  clanId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  role: ClanRole;
  joinedAt: Date;
  weeklyContribution: bigint;
}

export interface ClanWar {
  id: string;
  clan1Id: string;
  clan2Id: string;
  status: ClanWarStatus;
  clan1Score: bigint;
  clan2Score: bigint;
  startedAt: Date;
  endsAt: Date;
  winnerId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  gameType: string;
  status: TournamentStatus;
  prizePoolInCents: bigint;
  startedAt: Date;
  endsAt: Date;
  maxParticipants: number;
  currentParticipants: number;
  entryFeeInCents: bigint;
  leaderboard?: TournamentParticipant[];
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: bigint;
  rank?: number;
  prizeWonInCents?: bigint;
  joinedAt: Date;
}
