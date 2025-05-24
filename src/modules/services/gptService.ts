import axios from 'axios';
import { GPTResult } from '../../types/aiAnalysis.types.ts';
import { buildGptPrompt } from '../utils/buildGptPrompt.ts';

export interface AnalyzeInput {
  questionText: string;
  expectedAnswer: string;
  keywords: string[];
  complexityLevel: string;
  requiredSkills: string[];
  candidateSkills: string[];
  candidateExperience: string[];
  candidateEducation: string[];
  personalityScores: Record<string, number>;
  personalityFit?: number | null;
  transcript: string;
}

export const analyzeWithGPT = async (
  input: AnalyzeInput,
  model = 'gpt-4o'
): Promise<GPTResult> => {
  const prompt = buildGptPrompt(input);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI that only returns raw JSON without markdown, code blocks, or commentary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content: string = response.data.choices[0].message?.content;
    if (!content) throw new Error('Empty GPT response');

    const cleaned = content.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(cleaned);

    // Basit kontrol (dilersen Zod veya Joi ile schema doğrulama yapılabilir)
    if (
      typeof parsed.answerRelevanceScore !== 'number' ||
      typeof parsed.recommendation !== 'string'
    ) {
      throw new Error('Invalid JSON structure from GPT');
    }

    return parsed;
  } catch (err: any) {
    console.error('❌ GPT analiz hatası:', err?.response?.data || err.message);
    throw new Error('GPT yanıtı geçerli JSON değil veya API başarısız oldu.');
  }
};
