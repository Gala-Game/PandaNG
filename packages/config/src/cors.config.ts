export interface CorsConfig {
  origins: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
}

export function createCorsConfig(): CorsConfig {
  const originsStr = process.env['CORS_ORIGINS'] ?? 'http://localhost:3000';
  const origins = originsStr
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
  };
}
