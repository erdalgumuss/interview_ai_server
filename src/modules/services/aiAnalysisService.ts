import { analyzeFaceAndGestures } from './faceAnalyzerService.ts';
import { analyzeVoiceProsody } from './voiceProsodyService.ts';
import { analyzeWithGPT } from './gptService.ts';

type AIAnalysisInput = {
  videoPath: string;
  audioPath: string;
  transcription: string;
  questionText: string;
  expectedAnswer: string;
  keywords?: string[];
  aiMetadata?: Record<string, any>;
};

export type AIAnalysisResult = {
  face: Awaited<ReturnType<typeof analyzeFaceAndGestures>>;
  voice: Awaited<ReturnType<typeof analyzeVoiceProsody>>;
  gpt: Awaited<ReturnType<typeof analyzeWithGPT>>;
};

export async function runAIAnalysis(input: AIAnalysisInput, rest: any): Promise<AIAnalysisResult> {
  // Hepsi paralel çalışsın, biri geç/diğeri hızlı olabilir
const [face, voice, gpt] = await Promise.all([
    analyzeFaceAndGestures(input.videoPath),
    analyzeVoiceProsody(input.audioPath),
    analyzeWithGPT(
        input.transcription,
        input.questionText,
        input.expectedAnswer,
        input.keywords,
        input.aiMetadata,
        input.aiMetadata?.analyzeInput // Pass the AnalyzeInput object here if available
    ),
]);

  return { face, voice, gpt };
}
