// src/modules/queue/updateJobStatus.ts

import Redis from 'ioredis';
import { redisConfig } from '../../config/redis';

const redis = new Redis(redisConfig);

export type AIAnalysisStatus = {
  face?: string;   // 'pending', 'in_progress', 'completed', 'failed'
  voice?: string;
  gpt?: string;
  [key: string]: string | undefined;
};

/**
 * Job durumunu günceller.
 * @param jobId   string (zorunlu)
 * @param status  string (pipeline genel status, örn: 'processing', 'completed')
 * @param pipelineSteps  Record<string, string> (adım adım pipeline status, örn: 'video_downloaded': 'completed')
 * @param aiStatus AIAnalysisStatus (face, voice, gpt gibi analizlerin durumu)
 * @param extra   Record<string, any> (diğer ek veri, opsiyonel)
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

  // Pipeline step flag'leri
  if (pipelineSteps) {
    for (const [step, value] of Object.entries(pipelineSteps)) {
      statusObj[step] = value;
    }
  }

  // AI analiz statüleri JSON string olarak kaydediliyor
  if (aiStatus) {
    statusObj['ai'] = JSON.stringify(aiStatus);
  }

  // Ekstra alanlar (örn: hata mesajı, özel loglar)
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      statusObj[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }

  await redis.hset(`videoAnalysisJob:${jobId}`, statusObj);
}
