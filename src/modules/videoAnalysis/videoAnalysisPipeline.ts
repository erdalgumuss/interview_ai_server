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

export const processVideoAnalysis = async (jobData: VideoAnalysisJob) => {
  const { videoUrl, videoResponseId, applicationId } = jobData;

  console.log('🎬 Step 1: Downloading video...');
  const videoPath = await downloadVideo(videoUrl);

  console.log('🎵 Step 2: Extracting audio...');
  const audioPath = await extractAudioFromVideo(videoPath);

  console.log('🗣️ Step 3: Getting transcription...');
  const transcription: WhisperResponse = await getTranscription(audioPath);
  console.log('📝 Transcription:', transcription.text.slice(0, 100) + '...');

  const normalizedInput = normalizeAnalysisInput(jobData, transcription.text);

  console.log('🤖 Step 4-6: Running parallel AI analyses...');
  const [gptResult, faceResult, voiceResult] = await Promise.all([
    safeRun(() => analyzeWithGPT(normalizedInput), 'GPT'),
    safeRun(() => analyzeFaceAndGestures(videoPath), 'Face'),
    safeRun(() => analyzeVoiceProsody(audioPath, transcription.words || []), 'Voice'),
  ]);

  if (!gptResult || !faceResult || !voiceResult) {
    console.warn('⚠️ One or more AI analysis modules failed. Skipping save.');
    throw new Error('Incomplete AI analysis, job will be retried or logged.');
  }

  console.log('📊 Step 7: Calculating final scores...');
  const { communicationScore, overallScore } = calculateFinalScores({
    gptScore: gptResult.answerRelevanceScore,
    confidenceScore: faceResult.confidenceScore,
    voiceConfidenceScore: voiceResult.voiceConfidenceScore,
    speechFluencyScore: voiceResult.speechFluencyScore,
  });
  console.log('🧮 Final Scores:', { communicationScore, overallScore });

  console.log('💾 Step 8: Saving AI analysis to DB...');
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

  try {
    await fs.unlink(videoPath);
    console.log('🧹 Temp video file deleted');
    await fs.unlink(audioPath);
    console.log('🧹 Temp audio file deleted');
  } catch (err) {
    console.error('⚠️ Failed to delete temp files:', err);
  }

  return {
    transcription,
    gptResult,
    savedAnalysisId: savedResult._id,
    videoUrl,
  };
};

async function safeRun<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    const result = await fn();
    return result;
  } catch (err) {
    console.warn(`⚠️ ${label} analysis failed:`, err);
    return null;
  }
}
