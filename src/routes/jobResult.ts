// src/routes/jobResult.ts

import { FastifyInstance } from 'fastify';
import { getJobStatus } from '../modules/queue/getJobStatus.ts';
import { AIAnalysisModel } from '../modules/models/AIAnalysisModel.ts';
import { VideoResponseModel } from '../modules/models/VideoResponseModel.ts';

export async function jobResultRoutes(server: FastifyInstance) {
  server.get('/video-analysis/:jobId/result', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };

    // 1. Job statüsünü al
    const status = await getJobStatus(jobId);
    if (!status || !('status' in status)) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    // Her şeyden önce: Completed mi?
    if (status.status !== 'completed') {
      return reply.status(202).send({
        message: 'Analysis not completed yet.',
        status: status.status,
        progress: (status as any).aiStatus || {},
        updatedAt: (status as any).updatedAt || undefined,
      });
    }

    // VideoResponseId bir yerde var mı? (Redis'e nasıl kaydedildiğine bak!)
    const videoResponseId =
      (status as any).videoResponseId ||
      ((status as any).data && (status as any).data.videoResponseId);

    if (!videoResponseId) {
      return reply.status(400).send({ error: 'No videoResponseId associated with job.' });
    }

    // Önce VideoResponseModel’dan aiAnalysisId’yi bul
    const videoResponse = await VideoResponseModel.findById(videoResponseId).lean();
    if (!videoResponse?.aiAnalysisId) {
      return reply.status(404).send({ error: 'No AI analysis linked to this response.' });
    }

    // Sonra AIAnalysisModel’dan sonucu bul
    const result = await AIAnalysisModel.findById(videoResponse.aiAnalysisId).lean();
    if (!result) {
      return reply.status(404).send({ error: 'Result not found for completed job.' });
    }

    return reply.send(result);
  });
}
