// src/modules/queue/updateJobStatus.ts

import Redis from 'ioredis';
import { redisConfig } from '../../config/redis.ts';

const redis = new Redis(redisConfig);

type AIAnalysisStatus = {
  face?: string;    // örn: "in_progress", "completed", "failed"
  voice?: string;
  gpt?: string;
  [key: string]: string | undefined; // Diğer AI analizleri eklenebilir
};

/**
 * Job durumunu günceller.
 * @param jobId   string (zorunlu)
 * @param status  string (genel status, örn: "analyzing", "completed")
 * @param aiStatus AIAnalysisStatus (detay statuslar, opsiyonel)
 * @param extra   Record<string, any> (ek veri, opsiyonel)
 */
export async function updateJobStatus(
  jobId: string,
  status: string,
  aiStatus?: AIAnalysisStatus,
  extra?: Record<string, any>
) {
  if (!jobId) return;
  const statusObj: Record<string, string> = { status, updatedAt: new Date().toISOString() };

  if (aiStatus) {
    // JSON olarak saklanır, anahtar: "aiStatus"
    statusObj.aiStatus = JSON.stringify(aiStatus);
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      statusObj[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }

  await redis.hset(`videoAnalysisJob:${jobId}`, statusObj);
}
