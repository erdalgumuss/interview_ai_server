// src/routes/jobResult.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { VideoAnalysisModel } from '../models/VideoAnalysis.model.ts';

export async function jobResultRoutes(server: FastifyInstance) {
  // videoResponseId ile sorgula
  server.get('/api/job-result/:videoResponseId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { videoResponseId } = request.params as { videoResponseId: string };
    try {
      const result = await VideoAnalysisModel.findOne({ videoResponseId });
      if (!result) {
        return reply.code(404).send({ status: 'not_found', message: 'Sonuç bulunamadı.' });
      }
      return reply.send({
        status: 'success',
        result,
      });
    } catch (error: any) {
      request.log.error(error, '[JobResult] DB fetch hatası');
      return reply.code(500).send({
        status: 'error',
        message: 'Bir hata oluştu.',
        detail: error?.message,
      });
    }
  });

  // Alternatif: jobId ile sorgula (eğer flow root jobId'yi veriyorsan)
  server.get('/api/job-result/by-job/:jobId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };
    try {
      const result = await VideoAnalysisModel.findOne({ jobId });
      if (!result) {
        return reply.code(404).send({ status: 'not_found', message: 'Sonuç bulunamadı.' });
      }
      return reply.send({
        status: 'success',
        result,
      });
    } catch (error: any) {
      request.log.error(error, '[JobResult] DB fetch hatası');
      return reply.code(500).send({
        status: 'error',
        message: 'Bir hata oluştu.',
        detail: error?.message,
      });
    }
  });
}
