import { FastifyInstance } from 'fastify';
import { addVideoAnalysisJob } from '../modules/queue/addVideoAnalysisJob.ts';

interface AnalyzeVideoPayload {
  videoUrl: string;
  applicationId: string;
  questionId?: string;
  interviewId?: string;
}

export async function analyzeVideoRoutes(server: FastifyInstance) {
  server.post('/analyzeVideo', async (request, reply) => {
    try {
      const payload = request.body as AnalyzeVideoPayload;

      if (!payload?.videoUrl || !payload?.applicationId) {
        return reply.status(400).send({ error: 'Missing required fields: videoUrl or applicationId' });
      }

      if (!/^[0-9a-fA-F]{24}$/.test(payload.applicationId)) {
        return reply.status(400).send({ error: 'Invalid applicationId format' });
      }

      const jobId = await addVideoAnalysisJob(payload); // JobId'yi al!
      server.log.info(`🎬 Job added to queue for ${payload.videoUrl}, jobId: ${jobId}`);

      return reply.send({ status: 'Job added to queue successfully', jobId }); // JobId ile dön!
    } catch (error) {
      server.log.error('❌ Error adding job:', error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
