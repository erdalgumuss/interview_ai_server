import { RedisOptions } from 'ioredis';

export const redisConfig: RedisOptions = (() => {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL, maxRetriesPerRequest: 3, retryStrategy: (a) => Math.min(a * 100, 2000) };
  }
  return {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 3,
    retryStrategy: (attempts) => Math.min(attempts * 100, 2000),
  };
})();
