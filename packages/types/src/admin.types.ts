export enum AdminAction {
  // User actions
  BAN_USER = 'BAN_USER',
  UNBAN_USER = 'UNBAN_USER',
  SUSPEND_USER = 'SUSPEND_USER',
  UPDATE_USER_ROLE = 'UPDATE_USER_ROLE',
  MANUAL_CREDIT = 'MANUAL_CREDIT',
  MANUAL_DEBIT = 'MANUAL_DEBIT',
  FORCE_KYC_VERIFY = 'FORCE_KYC_VERIFY',

  // Jackpot actions
  UPDATE_JACKPOT_SEED = 'UPDATE_JACKPOT_SEED',
  FORCE_JACKPOT_WIN = 'FORCE_JACKPOT_WIN',
  TOGGLE_JACKPOT = 'TOGGLE_JACKPOT',

  // Payment actions
  APPROVE_WITHDRAWAL = 'APPROVE_WITHDRAWAL',
  REJECT_WITHDRAWAL = 'REJECT_WITHDRAWAL',

  // Fraud actions
  RESOLVE_FRAUD_SIGNAL = 'RESOLVE_FRAUD_SIGNAL',
  FLAG_ACCOUNT = 'FLAG_ACCOUNT',

  // Config actions
  UPDATE_LIVEOPS_CONFIG = 'UPDATE_LIVEOPS_CONFIG',
  CREATE_PROMOTION = 'CREATE_PROMOTION',
  DEACTIVATE_PROMOTION = 'DEACTIVATE_PROMOTION',
}

export enum FraudRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ModerationAction {
  WARNING = 'WARNING',
  TEMP_BAN = 'TEMP_BAN',
  PERM_BAN = 'PERM_BAN',
  RESTRICT_WITHDRAWALS = 'RESTRICT_WITHDRAWALS',
  REQUIRE_REVERIFICATION = 'REQUIRE_REVERIFICATION',
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorType: 'ADMIN' | 'SYSTEM' | 'PLAYER';
  action: AdminAction | string;
  resource: string;
  resourceId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export interface FraudSignal {
  id: string;
  userId: string;
  signalType: string;
  severity: FraudRiskLevel;
  data: Record<string, unknown>;
  isResolved: boolean;
  resolvedBy?: string;
  createdAt: Date;
}

export interface LiveOpsConfig {
  id: string;
  key: string;
  value: unknown;
  environment: string;
  description?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
