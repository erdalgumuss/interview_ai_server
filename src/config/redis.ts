import Redis from 'ioredis';
import { RedisOptions } from 'ioredis';
import { parse } from 'url';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

// BullMQ için ConnectionOptions döndürür
export const redisConfig: RedisOptions = (() => {
  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (attempts) => Math.min(attempts * 100, 2000),
    };
  } catch (err) {
    console.error('❌ REDIS_URL parse error:', err);
    throw err;
  }
})();

// ioredis client olarak kullanılacak nesne
export const redisClient = new Redis(redisUrl);
