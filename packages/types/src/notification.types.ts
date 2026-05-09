export enum NotificationType {
  JACKPOT_WIN = 'JACKPOT_WIN',
  WITHDRAWAL_APPROVED = 'WITHDRAWAL_APPROVED',
  WITHDRAWAL_REJECTED = 'WITHDRAWAL_REJECTED',
  DEPOSIT_CONFIRMED = 'DEPOSIT_CONFIRMED',
  MISSION_COMPLETE = 'MISSION_COMPLETE',
  ACHIEVEMENT_UNLOCK = 'ACHIEVEMENT_UNLOCK',
  VIP_UPGRADE = 'VIP_UPGRADE',
  PROMO_AVAILABLE = 'PROMO_AVAILABLE',
  CLAN_INVITE = 'CLAN_INVITE',
  CLAN_WAR_START = 'CLAN_WAR_START',
  CLAN_WAR_END = 'CLAN_WAR_END',
  KYC_REQUIRED = 'KYC_REQUIRED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  SYSTEM = 'SYSTEM',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
}

export interface RegisterPushTokenDto {
  token: string;
  deviceType: 'ios' | 'android' | 'web';
  deviceId: string;
}
