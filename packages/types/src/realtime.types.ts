export enum SocketEvents {
  // Jackpot events
  JACKPOT_TICK = 'jackpot:tick',
  JACKPOT_WIN = 'jackpot:win',

  // Game events
  GAME_RESULT = 'game:result',
  GAME_SESSION_START = 'game:session:start',
  GAME_SESSION_END = 'game:session:end',

  // Social events
  WINNER_ANNOUNCE = 'winner:announce',
  LEADERBOARD_UPDATE = 'leaderboard:update',
  LIVE_WIN = 'live:win',

  // Clan events
  CLAN_UPDATE = 'clan:update',
  CLAN_WAR_UPDATE = 'clan:war:update',

  // User events
  BALANCE_UPDATE = 'balance:update',
  NOTIFICATION = 'notification:new',
  MISSION_COMPLETE = 'mission:complete',
  ACHIEVEMENT_UNLOCK = 'achievement:unlock',

  // Presence
  PRESENCE_UPDATE = 'presence:update',
  ONLINE_COUNT = 'presence:count',

  // Room events
  JOIN_ROOM = 'room:join',
  LEAVE_ROOM = 'room:leave',

  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
}

export interface RealtimeEvent<T = unknown> {
  event: SocketEvents;
  data: T;
  timestamp: number;
  room?: string;
}

export interface PresencePayload {
  userId: string;
  username: string;
  status: 'online' | 'in-game' | 'offline';
  gameType?: string;
}

export interface LiveWinnerPayload {
  userId: string;
  username: string;
  avatarUrl?: string;
  gameType: string;
  winAmountInCents: string;
  isJackpot: boolean;
  timestamp: number;
}

export interface LeaderboardUpdate {
  type: 'daily' | 'weekly' | 'monthly' | 'alltime';
  topEntries: Array<{
    rank: number;
    userId: string;
    username: string;
    score: string;
    avatarUrl?: string;
  }>;
  updatedAt: number;
}

export interface ClanUpdatePayload {
  clanId: string;
  clanName: string;
  updateType: 'member_join' | 'member_leave' | 'war_start' | 'war_end' | 'xp_gain';
  data: Record<string, unknown>;
}

export interface BalanceUpdatePayload {
  userId: string;
  newBalanceInCents: string;
  newBonusBalanceInCents: string;
  changeInCents: string;
  transactionType: string;
}
