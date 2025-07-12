// src/modules/utils/normalizeQuestionAnalysisInput.ts
import { VideoAnalysisPipelineJob } from '../../types/VideoAnalysisPipelineJob.ts';

interface GPTAnalysisInput {
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
  const q = pipeline.question;
  const c = pipeline.application.candidate;
  const p = pipeline.personalityTest?.scores || {};

  return {
    questionText: q?.questionText ?? 'Not provided',
    expectedAnswer: q?.expectedAnswer ?? 'Not provided',
    keywords: q?.keywords ?? [],
    complexityLevel: q?.aiMetadata?.complexityLevel ?? 'Not specified',
    requiredSkills: q?.aiMetadata?.requiredSkills ?? [],

    candidateSkills: c?.skills?.technical ?? [],
    candidateExperience: c?.experience?.map(
      (e) => `${e.company}: ${e.position}`
    ) ?? [],
    candidateEducation: c?.education?.map(
      (e) => `${e.school} (${e.degree}, ${e.graduationYear})`
    ) ?? [],

    personalityScores: p,
    personalityFit: pipeline.personalityTest?.personalityFit ?? null,

    transcript: transcription ?? '',
  };
};
