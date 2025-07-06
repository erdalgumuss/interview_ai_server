// routes/applicationSubmission.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationSubmissionModel } from '../modules/models/applicationSubmission.model';
import { dispatchVideoAnalysisJobs } from '../modules/queue/dispatchVideoAnalysisJobs';

export async function applicationSubmissionRoutes(server: FastifyInstance) {
  server.post('/api/application-submissions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = request.body;

      // Gerekirse burada Joi/Yup/Zod ile schema validasyonu eklenebilir

      // MongoDB'ye başvuru kaydını oluştur
      const createdSubmission = await ApplicationSubmissionModel.create(payload);

      // Burada ileride: Her video için pipeline job başlatabilirsin (ör: BullMQ dispatch)
      // Her video için pipeline işlerini başlat!
      const dispatchedJobs = await dispatchVideoAnalysisJobs(createdSubmission);

      return reply.code(201).send({
        status: 'success',
        message: 'Başvuru başarıyla kaydedildi.',
        applicationSubmissionId: createdSubmission._id,
        dispatchedJobs, // videoResponseId ve jobId eşleşmeleri ile döner
        videoResponses: createdSubmission.videoResponses.map(v => ({
          videoResponseId: v.videoResponseId,
          questionId: v.questionId,
          status: v.status,
        }))
      });
    } catch (error: any) {
      request.log.error(error, '[Application Submission] Başvuru kaydında hata');
      return reply.code(500).send({
        status: 'error',
        message: 'Bir hata oluştu.',
        detail: error.message
      });
    }
  });
}
