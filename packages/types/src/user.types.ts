export enum UserRole {
  PLAYER = 'PLAYER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  PENDING_KYC = 'PENDING_KYC',
  DEACTIVATED = 'DEACTIVATED',
}

export enum KYCStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  REQUIRES_RESUBMISSION = 'REQUIRES_RESUBMISSION',
}

export enum VIPLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  PANDA_ELITE = 'PANDA_ELITE',
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KYCStatus;
  vipLevel: VIPLevel;
  phoneNumber?: string;
  country?: string;
  timezone: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  vipLevel: VIPLevel;
  avatarUrl?: string;
  totalWins: number;
  biggestWinInCents: bigint;
  clanId?: string;
  clanName?: string;
  joinedAt: Date;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  phoneNumber?: string;
  country?: string;
  referralCode?: string;
}

export interface UpdateUserDto {
  username?: string;
  phoneNumber?: string;
  country?: string;
  timezone?: string;
  avatarUrl?: string;
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
