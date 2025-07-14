import { VideoAnalysisPipelineJob } from '../../types/VideoAnalysisPipelineJob.ts';

export interface GPTAnalysisInput {
  questionText: string;
  expectedAnswer: string;
  keywords: string[];
  complexityLevel: string;
  requiredSkills: string[];
  candidateSkills: string[];
  candidateExperience: string[];
  candidateEducation: string[];
  personalityScores: Record<string, number>;
  personalityFit: number | null;
  transcript: string;
}

export const normalizeAnalysisInput = (
  pipeline: VideoAnalysisPipelineJob,
  transcription: string
): GPTAnalysisInput => {
  // root'tan veya question objesinden al
  const q = (pipeline as any).question || pipeline;
  const c = pipeline.application.candidate;
  const p = (pipeline as any).personalityTest?.scores || {};

  return {
    questionText: q?.questionText ?? 'Not provided',
    expectedAnswer: q?.expectedAnswer ?? 'Not provided',
    keywords: q?.keywords ?? [],
    complexityLevel: q?.aiMetadata?.complexityLevel ?? 'Not specified',
    requiredSkills: q?.aiMetadata?.requiredSkills ?? [],

    candidateSkills: c?.skills?.technical ?? [],
    candidateExperience: c?.experience?.map(
      (e: any) => `${e.company}: ${e.position}`
    ) ?? [],
    candidateEducation: c?.education?.map(
      (e: any) => `${e.school} (${e.degree}, ${e.graduationYear})`
    ) ?? [],

    personalityScores: p,
    personalityFit: (pipeline as any).personalityTest?.personalityFit ?? null,

    transcript: transcription ?? '',
  };
};
