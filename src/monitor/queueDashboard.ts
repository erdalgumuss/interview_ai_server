// src/monitor/queueDashboard.ts
import { FastifyInstance } from 'fastify';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { FastifyAdapter } from '@bull-board/fastify';
import { videoAnalysisQueue } from '../jobs/videoAnalysisQueue.ts';

export async function setupQueueDashboard(server: FastifyInstance) {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath('/admin/queues');
  createBullBoard({
    queues: [new BullMQAdapter(videoAnalysisQueue)],
    serverAdapter,
  });

  // Fastify ile Bull Board dashboard'u register et
  server.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' });
}
