// src/routes/jobStatus.ts
import { FastifyInstance } from 'fastify';
import { getJobStatus } from '../modules/queue/getJobStatus.ts';

export async function jobStatusRoutes(server: FastifyInstance) {
  server.get('/video-analysis/:jobId/status', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const status = await getJobStatus(jobId);
    if (!status) return reply.status(404).send({ error: 'Job not found' });
    return reply.send(status);
  });
}
