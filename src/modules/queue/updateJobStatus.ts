import Redis from 'ioredis';
import { redisConfig } from '../../config/redis.ts';

const redis = new Redis(redisConfig);

export type AIAnalysisStatus = {
  face?: string;   // 'pending', 'in_progress', 'completed', 'failed'
  voice?: string;
  gpt?: string;
  [key: string]: string | undefined;
};

/**
 * Redis'teki bir video analysis job'un statüsünü günceller.
 * 
 * @param jobId         - BullMQ job id'si
 * @param status        - Genel pipeline status (örn: 'processing', 'completed', 'failed')
 * @param pipelineSteps - Adım adım pipeline status güncelle (örn: {'pipelineSteps.video_downloaded': 'done'})
 * @param aiStatus      - AI analizleri için adım adım durumlar
 * @param extra         - Diğer ek veri
 */
export async function updateJobStatus(
  jobId: string,
  status: string,
  pipelineSteps?: Record<string, string>,
  aiStatus?: AIAnalysisStatus,
  extra?: Record<string, any>
) {
  if (!jobId) return;

  const statusObj: Record<string, string> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  // Eğer pipelineSteps objesindeki anahtarlar flat gelirse (örn: 'pipelineSteps.audio_extracted'), doğrudan ekle.
  if (pipelineSteps) {
    for (const [step, value] of Object.entries(pipelineSteps)) {
      statusObj[step] = value;
    }
  }

  // AI analiz statüleri JSON olarak kaydediliyor
  if (aiStatus) {
    statusObj['ai'] = JSON.stringify(aiStatus);
  }

  // Ekstra alanlar (örn: hata mesajı, özel loglar)
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      statusObj[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }

  // Null/undefined stringlerini kaydetmemek için filtrele
  Object.keys(statusObj).forEach(key => {
    if (statusObj[key] === undefined || statusObj[key] === null) {
      delete statusObj[key];
    }
  });

  await redis.hset(`videoAnalysisJob:${jobId}`, statusObj);
}
