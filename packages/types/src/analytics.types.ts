export enum EventName {
  // User lifecycle
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  KYC_SUBMITTED = 'kyc_submitted',
  KYC_COMPLETED = 'kyc_completed',

  // Financial
  DEPOSIT_INITIATED = 'deposit_initiated',
  DEPOSIT_COMPLETED = 'deposit_completed',
  WITHDRAWAL_REQUESTED = 'withdrawal_requested',
  WITHDRAWAL_COMPLETED = 'withdrawal_completed',

  // Gaming
  GAME_SESSION_START = 'game_session_start',
  GAME_SESSION_END = 'game_session_end',
  JACKPOT_WIN = 'jackpot_win',
  BIG_WIN = 'big_win',

  // Engagement
  MISSION_COMPLETE = 'mission_complete',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  VIP_UPGRADE = 'vip_upgrade',
  CLAN_JOIN = 'clan_join',
  TOURNAMENT_ENTER = 'tournament_enter',

  // Retention
  DAILY_LOGIN_BONUS = 'daily_login_bonus',
  BATTLE_PASS_PURCHASE = 'battle_pass_purchase',
  PROMO_REDEEMED = 'promo_redeemed',
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId?: string;
  event: EventName | string;
  properties: Record<string, unknown>;
  deviceId?: string;
  ipAddress?: string;
  timestamp: Date;
  processedAt?: Date;
}

export enum UserSegment {
  NEW = 'NEW',
  CASUAL = 'CASUAL',
  REGULAR = 'REGULAR',
  HIGH_VALUE = 'HIGH_VALUE',
  VIP = 'VIP',
  AT_RISK = 'AT_RISK',
  CHURNED = 'CHURNED',
  REACTIVATED = 'REACTIVATED',
}
