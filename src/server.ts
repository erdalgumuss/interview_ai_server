import Fastify from 'fastify';
import dotenv from 'dotenv';
import { analyzeVideoRoutes } from './routes/analyzeVideo.ts';
import { connectMongoDB } from './config/db.ts';
import fastifyExpress from '@fastify/express';
import cors from '@fastify/cors';

dotenv.config();
const server = Fastify({ logger: true, requestTimeout: 30000 });

await server.register(fastifyExpress);
await server.register(cors, { origin: '*' });
await server.register(analyzeVideoRoutes, { prefix: '/api' });

server.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await connectMongoDB();
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`✅ Server running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  server.log.info('🛑 Gracefully shutting down...');
  await server.close();
  process.exit(0);
});

start();
