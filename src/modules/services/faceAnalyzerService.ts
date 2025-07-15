import axios from 'axios';

const FACE_ANALYZER_URL = process.env.FACE_ANALYZER_URL || 'http://face_analyzer:8001';

export interface FaceAnalyzeResponse {
  jobId: string;
  status: string;
}

export interface FaceAnalyzeResult {
  status: string;
  engagementScore?: number;
  confidenceScore?: number;
  emotionLabel?: string;
  error?: string;
}

export async function requestFaceAnalysis(videoPath: string): Promise<string> {
  const { data } = await axios.post<FaceAnalyzeResponse>(
    `${FACE_ANALYZER_URL}/face/analyze`,
    { video_path: videoPath }
  );
  if (!data.jobId) throw new Error('Face analyzer did not return jobId');
  return data.jobId;
}

export async function getFaceAnalysisStatus(jobId: string): Promise<FaceAnalyzeResult> {
  const { data } = await axios.get<FaceAnalyzeResult>(
    `${FACE_ANALYZER_URL}/face/status/${jobId}`
  );
  return data;
}
