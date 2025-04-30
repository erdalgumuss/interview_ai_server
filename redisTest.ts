import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
});

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
