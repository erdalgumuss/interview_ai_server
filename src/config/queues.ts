//src/config/queues.ts

import { Queue } from 'bullmq';
import { redisConfig } from './redis.ts';

export const videoDownloadQueue   = new Queue('video-download-queue', { connection: redisConfig });
export const audioExtractQueue    = new Queue('audio-extract-queue',   { connection: redisConfig });
export const transcriptionQueue   = new Queue('transcription-queue',   { connection: redisConfig });
//export const normalizeInputQueue = new Queue('normalize-input-queue', { connection: redisConfig });
export const faceAnalysisQueue    = new Queue('face-analysis-queue',   { connection: redisConfig });
export const voiceAnalysisQueue   = new Queue('voice-analysis-queue',  { connection: redisConfig });
export const gptAnalysisQueue     = new Queue('gpt-analysis-queue',    { connection: redisConfig });
export const scoreCalculateQueue  = new Queue('score-calculate-queue', { connection: redisConfig });
export const resultsSaveQueue     = new Queue('results-save-queue',    { connection: redisConfig });
export const cleanupQueue         = new Queue('cleanup-queue',        { connection: redisConfig });