import { VideoAnalysisJob } from '../../types/VideoAnalysisJob';

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
  jobData: VideoAnalysisJob,
  transcription: string
): GPTAnalysisInput => {
  const q = jobData.question;
  const c = jobData.candidate;
  const p = jobData.personalityTest?.scores || {};

  return {
    questionText: q.questionText ?? 'Not provided',
    expectedAnswer: q.expectedAnswer ?? 'Not provided',
    keywords: q.keywords ?? [],
    complexityLevel: q.aiMetadata?.complexityLevel ?? 'Not specified',
    requiredSkills: q.aiMetadata?.requiredSkills ?? [],

    candidateSkills: c.skills?.technical ?? [],
    candidateExperience: c.experience?.map(
      (e) => `${e.company}: ${e.responsibilities}`
    ) ?? [],
    candidateEducation: c.education?.map(
      (e) => `${e.school} (${e.degree}, ${e.graduationYear})`
    ) ?? [],

    personalityScores: p,
    personalityFit: jobData.personalityTest?.personalityFit ?? null,

    transcript: transcription ?? '',
  };
};
