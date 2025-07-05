// src/modules/queue/getJobStatus.ts

import Redis from 'ioredis';
import { redisConfig } from '../../config/redis.ts';

const redis = new Redis(redisConfig);

export async function getJobStatus(jobId: string) {
  if (!jobId) return { status: null };
  // Statusları Redis'te hash olarak tuttuğumuzu varsayıyoruz
  const statusObj = await redis.hgetall(`videoAnalysisJob:${jobId}`);
  if (!statusObj || Object.keys(statusObj).length === 0) {
    return { status: null };
  }
  // İstersen burada date parse vb. yapabilirsin
  return statusObj;
}