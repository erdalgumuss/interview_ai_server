// routes/applicationSubmission.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dispatchVideoAnalysisJobs } from '../modules/queue/dispatchVideoAnalysisJobs.ts';
import mongoose from 'mongoose';

// Kendi raw başvuru koleksiyonumuz (her şey JSON olarak saklanır)
const ApplicationSubmissionRawSchema = new mongoose.Schema({
  payload: { type: Object, required: true }
}, { timestamps: true });

const ApplicationSubmissionRawModel = mongoose.model('ApplicationSubmissionRaw', ApplicationSubmissionRawSchema);

export async function applicationSubmissionRoutes(server: FastifyInstance) {
  server.post('/api/application-submissions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1) Gelen JSON'u al
      const payload = request.body as any;

      // 2) (Opsiyonel) Zod veya benzeri ile ana tip kontrolü yapabilirsin
      // validatePayloadWithZod(payload);

      // 3) Tamamını 'raw' olarak kaydet (ham başvuru, hata araştırmada kolaylık sağlar)
      const createdSubmission = await ApplicationSubmissionRawModel.create({ payload });

      // 4) Her video için iş başlat (payload'u parametre olarak doğrudan gönder)
      const dispatchedJobs = await dispatchVideoAnalysisJobs(payload);

      // 5) Geri dönecek özet (örnek)
      return reply.code(201).send({
        status: 'success',
        message: 'Başvuru başarıyla alındı ve analiz kuyruğuna eklendi.',
        submissionId: createdSubmission._id,
        dispatchedJobs, // {jobId, videoResponseId, questionId}
        questionCount: payload.interview.questions?.length || 0
      });

    } catch (error: any) {
      request.log.error(error, '[AI Application Submission] Kayıt/dispatch hatası');
      return reply.code(500).send({
        status: 'error',
        message: 'Bir hata oluştu.',
        detail: error?.message
      });
    }
  });
}
