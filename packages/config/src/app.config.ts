export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  serviceName: string;
  version: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export function createAppConfig(serviceName: string, defaultPort: number): AppConfig {
  return {
    nodeEnv: (process.env['NODE_ENV'] as AppConfig['nodeEnv']) ?? 'development',
    port: parseInt(process.env['PORT'] ?? String(defaultPort), 10),
    serviceName,
    version: process.env['npm_package_version'] ?? '1.0.0',
    logLevel: (process.env['LOG_LEVEL'] as AppConfig['logLevel']) ?? 'info',
  };
}

export function isDevelopment(): boolean {
  return process.env['NODE_ENV'] === 'development';
}

export function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

export function isTest(): boolean {
  return process.env['NODE_ENV'] === 'test';
}
