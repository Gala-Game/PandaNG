export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
}

export function createJwtConfig(): JwtConfig {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  if (secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

  const refreshSecret = process.env['JWT_REFRESH_SECRET'];
  if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET environment variable is required');
  if (refreshSecret.length < 32)
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');

  return {
    secret,
    refreshSecret,
    accessExpiresIn: process.env['JWT_ACCESS_EXPIRY'] ?? '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRY'] ?? '7d',
    issuer: 'panda-ng',
    audience: 'panda-ng-client',
  };
}
