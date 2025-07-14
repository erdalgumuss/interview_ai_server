// src/schedulers/stepTransitionMap.ts
import type { PipelineStepKey } from '../types/VideoAnalysisPipelineJob.ts';

export const stepTransitionMap: Record<PipelineStepKey, {
  nextStep?: PipelineStepKey;
  queueName?: string;
  jobName?: string;
}> = {
  video_downloaded:   { nextStep: 'audio_extracted', queueName: 'audioExtractQueue', jobName: 'extractAudio' },
  audio_extracted:    { nextStep: 'transcribed',     queueName: 'transcriptionQueue', jobName: 'transcribeAudio' },
  transcribed:        { nextStep: 'face_analyzed',   queueName: 'faceAnalysisQueue', jobName: 'analyzeFace' },
  face_analyzed:      { nextStep: 'voice_analyzed',  queueName: 'voiceAnalysisQueue', jobName: 'analyzeVoice' },
  voice_analyzed:     { nextStep: 'gpt_analyzed',    queueName: 'gptAnalysisQueue', jobName: 'analyzeGPT' },
  gpt_analyzed:       { nextStep: 'final_scored',    queueName: 'scoreCalculateQueue', jobName: 'calculateScore' },
  final_scored:       { nextStep: 'results_saved',   queueName: 'resultsSaveQueue', jobName: 'saveResults' },
  results_saved:      {},
};
