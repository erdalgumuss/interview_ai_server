import axios from 'axios';

const VOICE_ANALYZER_URL = process.env.VOICE_ANALYZER_URL || 'http://voice_analyzer:8002';

export interface VoiceAnalyzeResponse {
  jobId: string;
  status: string;
}

export interface VoiceAnalyzeResult {
  status: string;
  speechRate?: number;
  energyMean?: number;
  dominantEmotion?: string;
  // ... diğer metrikler
  error?: string;
}

export async function requestVoiceAnalysis(audioPath: string): Promise<string> {
  const { data } = await axios.post<VoiceAnalyzeResponse>(
    `${VOICE_ANALYZER_URL}/voice/analyze`,
    { audio_path: audioPath }
  );
  if (!data.jobId) throw new Error('Voice analyzer did not return jobId');
  return data.jobId;
}

export async function getVoiceAnalysisStatus(jobId: string): Promise<VoiceAnalyzeResult> {
  const { data } = await axios.get<VoiceAnalyzeResult>(
    `${VOICE_ANALYZER_URL}/voice/status/${jobId}`
  );
  return data;
}
