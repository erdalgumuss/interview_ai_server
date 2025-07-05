// videoAnalysisPipeline.ts

import fs from 'fs/promises';
import { VideoAnalysisJob } from '../../types/VideoAnalysisJob.ts';
import { downloadVideo } from '../services/videoDownloadService.ts';
import { extractAudioFromVideo } from '../services/extractAudioService.ts';
import { getTranscription, WhisperResponse } from '../services/whisperService.ts';
import { analyzeWithGPT } from '../services/gptService.ts';
import { analyzeFaceAndGestures } from '../services/faceAnalysisService.ts';
import { analyzeVoiceProsody } from '../services/voiceProsodyService.ts';
import { calculateFinalScores } from '../services/aiScoreCalculator.ts';
import { saveAIAnalysisResult } from './saveAIAnalysis.ts';
import { normalizeAnalysisInput } from '../utils/normalizeQuestionAnalysisInput.ts';
import { updateJobStatus } from '../queue/updateJobStatus';

export const processVideoAnalysis = async (jobData: VideoAnalysisJob, jobId: string) => {
  const { videoUrl, videoResponseId, applicationId } = jobData;

  // Status objesi, hangi analiz modülünün hangi durumda olduğunu gösterir.
  let aiStatus = { face: "pending", gpt: "pending", voice: "pending" };

  try {
    // 1. Video indiriliyor
    await updateJobStatus(jobId, 'downloading_video', aiStatus);
    const videoPath = await downloadVideo(videoUrl);

    // 2. Audio çıkarılıyor
    await updateJobStatus(jobId, 'extracting_audio', aiStatus);
    const audioPath = await extractAudioFromVideo(videoPath);

    // 3. Transcript çıkarılıyor
    await updateJobStatus(jobId, 'transcribing_audio', aiStatus);
    const transcription: WhisperResponse = await getTranscription(audioPath);

    // 4. Input normalize
    await updateJobStatus(jobId, 'normalizing_input', aiStatus);
    const normalizedInput = normalizeAnalysisInput(jobData, transcription.text);

    // 5. Paralel AI Analizleri
    await updateJobStatus(jobId, 'running_ai_analyses', aiStatus);

    const [gptResult, faceResult, voiceResult] = await Promise.all([
      (async () => {
        aiStatus.gpt = 'in_progress';
        await updateJobStatus(jobId, 'running_ai_analyses', aiStatus);
        try {
          const result = await analyzeWithGPT(normalizedInput);
          aiStatus.gpt = 'completed';
          await updateJobStatus(jobId, 'running_ai_analyses', aiStatus);
          return result;
        } catch (e) {
          aiStatus.gpt = 'failed';
          await updateJobStatus(jobId, 'running_ai_analyses', { ...aiStatus, gptError: (e as any)?.message });
          throw e;
        }
      })(),
      (async () => {
        aiStatus.face = 'in_progress';
        await updateJobStatus(jobId, 'running_ai_analyses', aiStatus);
        try {
          const result = await analyzeFaceAndGestures(videoPath);
          aiStatus.face = 'completed';
          await updateJobStatus(jobId, 'running_ai_analyses', aiStatus);
          return result;
        } catch (e) {
          aiStatus.face = 'failed';
          await updateJobStatus(jobId, 'running_ai_analyses', { ...aiStatus, faceError: (e as any)?.message });
          throw e;
        }
      })(),
      (async () => {
        aiStatus.voice = 'in_progress';
        await updateJobStatus(jobId, 'running_ai_analyses', aiStatus);
        try {
          const result = await analyzeVoiceProsody(audioPath, transcription.words || []);
          aiStatus.voice = 'completed';
          await updateJobStatus(jobId, 'running_ai_analyses', aiStatus);
          return result;
        } catch (e) {
          aiStatus.voice = 'failed';
          await updateJobStatus(jobId, 'running_ai_analyses', { ...aiStatus, voiceError: (e as any)?.message });
          throw e;
        }
      })(),
    ]);

    // 6. Final skor hesaplama
    await updateJobStatus(jobId, 'calculating_final_scores', aiStatus);
    const { communicationScore, overallScore } = calculateFinalScores({
      gptScore: gptResult.answerRelevanceScore,
      confidenceScore: faceResult.confidenceScore,
      voiceConfidenceScore: voiceResult.voiceConfidenceScore,
      speechFluencyScore: voiceResult.speechFluencyScore,
    });

    // 7. Sonuç kaydediliyor
    await updateJobStatus(jobId, 'saving_results', aiStatus);
    const savedResult = await saveAIAnalysisResult({
      videoResponseId,
      applicationId,
      transcription: transcription.text,
      gptResult,
      faceResult,
      voiceResult,
      overallScore,
      communicationScore,
    });

    // 8. Cleanup
    try {
      await fs.unlink(videoPath);
      await fs.unlink(audioPath);
    } catch {}

    await updateJobStatus(jobId, 'completed', { ...aiStatus, savedAnalysisId: savedResult._id });

    return {
      transcription,
      gptResult,
      faceResult,
      voiceResult,
      savedAnalysisId: savedResult._id,
      videoUrl,
    };
  } catch (err) {
    // Hata durumunda son status ile birlikte hata mesajı eklenir
    await updateJobStatus(jobId, 'failed', { ...aiStatus, error: (err as any)?.message || 'Unknown error' });
    throw err;
  }
};
