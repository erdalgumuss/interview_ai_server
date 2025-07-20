// import { Job } from 'bullmq';
// import { BaseWorker } from './base/baseWorker.ts';
// import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
// import { calculateFinalScores } from '../services/aiScoreCalculator.ts';
// import { scheduleNextStep } from '../../schedulers/pipelineScheduler.ts';

// export class ScoreCalculateWorker extends BaseWorker {
//   constructor() {
//     super('score-calculate-queue');
//   }

//   protected async handleJob(job: Job): Promise<void> {
//     const { pipelineId } = job.data;
//     if (!pipelineId) throw new Error('Missing pipelineId!');

//     const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
//     if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);

//     pipeline.pipelineSteps.final_scored.state = 'in_progress';
//     pipeline.pipelineSteps.final_scored.startedAt = new Date().toISOString();
//     await pipeline.save();

//     try {
//       // Gerekli skorlar: (yoksa 0 kabul edilir)
//       const gptScore             = pipeline.aiResult?.answerRelevanceScore ?? 0;
//       const confidenceScore      = pipeline.faceScores?.confidenceScore ?? 0;
//       const voiceConfidenceScore = pipeline.voiceScores?.voiceConfidenceScore ?? 0;
//       const speechFluencyScore   = pipeline.voiceScores?.speechFluencyScore ?? 0;

//       const { communicationScore, overallScore } = calculateFinalScores(
//         {
//           gptScore,
//           confidenceScore,
//           voiceConfidenceScore,
//           speechFluencyScore
//         },
//         pipeline // veya ekstra başka veriler gerekiyorsa (2. parametre: rest)
//       );

//       pipeline.overallScore = overallScore;
//       pipeline.pipelineSteps.final_scored.state = 'done';
//       pipeline.pipelineSteps.final_scored.finishedAt = new Date().toISOString();
//       pipeline.pipelineSteps.final_scored.details = { communicationScore, overallScore };
//       await pipeline.save();

//       // Sonraki adım: Sonucu kaydetme (veya pipeline bitişi)
//       await scheduleNextStep(pipelineId, 'final_scored');
//     } catch (err) {
//       pipeline.pipelineSteps.final_scored.state = 'error';
//       pipeline.pipelineSteps.final_scored.error = (err as Error).message;
//       await pipeline.save();
//       throw err;
//     }
//   }
// }

// new ScoreCalculateWorker();
