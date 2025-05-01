import fs from 'fs/promises';

import { downloadVideo } from '../services/videoDownloadService.ts';
import { extractAudioFromVideo } from '../services/extractAudioService.ts';
import { getTranscription, WhisperResponse } from '../services/whisperService.ts';
import { analyzeWithGPT } from '../services/gptService.ts';
import { analyzeFaceAndGestures } from '../services/faceAnalysisService.ts';
import { analyzeVoiceProsody } from '../services/voiceProsodyService.ts';
import { calculateFinalScores } from '../services/aiScoreCalculator.ts';
import { saveAIAnalysisResult } from './saveAIAnalysis.ts';
import { normalizeAnalysisInput } from '../utils/normalizeQuestionAnalysisInput.ts';

export const processVideoAnalysis = async (jobData: any) => {
  const { videoUrl, question, interview } = jobData;

  console.log('🎬 Step 1: Downloading video...');
  const videoPath = await downloadVideo(videoUrl);

  console.log('🎵 Step 2: Extracting audio...');
  const audioPath = await extractAudioFromVideo(videoPath);

  console.log('🗣️ Step 3: Getting transcription from Whisper...');
  const transcription: WhisperResponse = await getTranscription(audioPath);
  console.log('📝 Transcription:', transcription);

  const normalizedInput = normalizeAnalysisInput(jobData, transcription.text);

  console.log('🤖 Step 4: Analyzing with GPT...');
  const gptResult = await analyzeWithGPT(normalizedInput);
  console.log('📊 GPT Analysis:', gptResult);

  console.log('🎭 Step 5: Analyzing face expressions...');
  const faceResult = await analyzeFaceAndGestures(videoPath);
  console.log('🧠 Face Analysis:', faceResult);

  console.log('🔊 Step 6: Analyzing voice prosody...');
  const voiceResult = await analyzeVoiceProsody(audioPath, transcription.words || []);
  console.log('📈 Voice Analysis:', voiceResult);

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
    videoResponseId: jobData.videoResponseId,
    applicationId: jobData.applicationId,
    transcription: transcription.text,
    gptResult,
    faceResult,
    voiceResult,
    overallScore,
    communicationScore,
    // TODO: future fields like answerDuration, whisperConfidence can be added here
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
