import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not defined');
}
const redis = new Redis(process.env.REDIS_URL as string);


async function test() {
  try {
    const pong = await redis.ping();
    console.log('Redis Bağlantı Testi Başarılı:', pong);
    process.exit(0);
  } catch (err) {
    console.error('Redis Bağlantı Hatası:', err);
    process.exit(1);
  }
}

test();
