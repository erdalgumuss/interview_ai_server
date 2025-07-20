import { FastifyInstance } from 'fastify';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { FastifyAdapter } from '@bull-board/fastify';

import {
  videoDownloadQueue, audioExtractQueue, transcriptionQueue,
  faceAnalysisQueue, voiceAnalysisQueue, questionEvaluationQueue,
  scoreCalculateQueue, resultsSaveQueue,
  questionAnalyzedQueue,
  
} from '../config/queues.ts';

// Bull Board dashboard'u başlatan fonksiyon
export async function setupQueueDashboard(server: FastifyInstance) {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(videoDownloadQueue),
      new BullMQAdapter(audioExtractQueue),
      new BullMQAdapter(transcriptionQueue),
      new BullMQAdapter(faceAnalysisQueue),
      new BullMQAdapter(voiceAnalysisQueue),
      new BullMQAdapter(questionAnalyzedQueue),
      new BullMQAdapter(questionAnalyzedQueue),
      new BullMQAdapter(scoreCalculateQueue),
      new BullMQAdapter(resultsSaveQueue),
    ],
    serverAdapter,
  });

  // Bull Board dashboard'u Fastify'a entegre et
  server.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' });
}
