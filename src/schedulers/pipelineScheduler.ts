// src/schedulers/pipelineScheduler.ts

import type { PipelineStepKey } from '../types/VideoAnalysisPipelineJob.ts';
import { stepTransitionMap } from './stepTransitionMap.ts'; // mapping dosyan
import * as queues from '../config/queues.ts'; // tüm kuyrukları export eden dosya
import { VideoAnalysisPipelineJobModel } from '../models/VideoAnalysisPipelineJob.model.ts';

/**
 * Bir pipeline adımı başarıyla tamamlandığında çağrılır.
 * Doğruysa sıradaki adım ilgili kuyruğa eklenir.
 *
 * @param pipelineId - Mongo'daki pipeline kaydının id'si
 * @param currentStep - Bitirilen adımın anahtarı (örn: "gpt_analyzed")
 */
export async function scheduleNextStep(pipelineId: string, currentStep: PipelineStepKey) {
  // 1. Pipeline'ı bul
  const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
  if (!pipeline) return;

  // 2. Geçiş haritasından sıradaki adımı bul
  const transition = stepTransitionMap[currentStep];
  if (!transition || !transition.nextStep) return; // son adım olabilir

  // 3. Sıradaki adım "pending" ise devam et
  const nextStep = transition.nextStep;
  if (!nextStep) return;

  // Pipeline'ın steps map'inde tip güvenli erişim
  if (pipeline.pipelineSteps[nextStep]?.state !== 'pending') return;

  // 4. Kuyruğu ve job ismini haritadan çek
  const queue = queues[transition.queueName as keyof typeof queues];
  const jobName = transition.jobName;

  if (!queue) throw new Error(`Queue not found: ${transition.queueName}`);

  // 5. İşe sıradaki pipelineId'yi ekle
  if (!queue) throw new Error(`Queue not found: ${transition.queueName}`);
if (!jobName) throw new Error(`Job name not found for step: ${nextStep}`);

await queue.add(jobName, { pipelineId });
}
