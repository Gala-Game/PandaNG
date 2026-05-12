export interface RedisConfig {
  url: string;
  clusterNodes?: string[];
  keyPrefix: string;
  maxRetries: number;
  retryDelay: number;
  connectTimeout: number;
  commandTimeout: number;
}

export function createRedisConfig(keyPrefix = 'panda-ng:'): RedisConfig {
  const url = process.env['REDIS_URL'];
  if (!url) throw new Error('REDIS_URL environment variable is required');

  const clusterNodesStr = process.env['REDIS_CLUSTER_NODES'];
  const clusterNodes = clusterNodesStr
    ? clusterNodesStr
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
    : undefined;

  return {
    url,
    ...(clusterNodes !== undefined ? { clusterNodes } : {}),
    keyPrefix,
    maxRetries: parseInt(process.env['REDIS_MAX_RETRIES'] ?? '3', 10),
    retryDelay: parseInt(process.env['REDIS_RETRY_DELAY'] ?? '1000', 10),
    connectTimeout: parseInt(process.env['REDIS_CONNECT_TIMEOUT'] ?? '10000', 10),
    commandTimeout: parseInt(process.env['REDIS_COMMAND_TIMEOUT'] ?? '5000', 10),
  };
}
