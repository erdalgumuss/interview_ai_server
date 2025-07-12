import { FastifyInstance } from 'fastify';
import { createInterviewRecordAndPipelines } from '../services/interviewRecordService.ts';

export async function interviewRecordRoutes(server: FastifyInstance) {
  server.post('/interview-record', async (request, reply) => {
    try {
      const { meta, application, interview } = request.body as {
        meta: any;
        application: any;
        interview: { questions: any[]; [key: string]: any };
      };
      if (!interview || !interview.questions || !Array.isArray(interview.questions)) {
        return reply.status(400).send({ ok: false, error: 'interview.questions array is required' });
      }
      const interviewRecord = await createInterviewRecordAndPipelines({ meta, application, interview });
      return reply.status(201).send({
        ok: true,
        interviewRecordId: interviewRecord._id,
        pipelines: interviewRecord.interview.questions.map((q: { id: string; pipelineId?: string }) => ({
          questionId: q.id,
          pipelineId: q.pipelineId ?? null
        }))
      });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ ok: false, error: 'Internal Server Error' });
    }
  });
}
