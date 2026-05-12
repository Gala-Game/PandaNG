export interface DatabaseConfig {
  url: string;
  directUrl?: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  logQueries: boolean;
}

export function createDatabaseConfig(): DatabaseConfig {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL environment variable is required');

  return {
    url,
    directUrl: process.env['DATABASE_DIRECT_URL'],
    maxConnections: parseInt(process.env['DB_MAX_CONNECTIONS'] ?? '10', 10),
    connectionTimeout: parseInt(process.env['DB_CONNECTION_TIMEOUT'] ?? '5000', 10),
    queryTimeout: parseInt(process.env['DB_QUERY_TIMEOUT'] ?? '30000', 10),
    logQueries: process.env['DB_LOG_QUERIES'] === 'true',
  };
}
