import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import { GPTAnalysisInput, GPTAnalysisOutput } from '../../types/aiAnalysis.types.ts';
import { buildGptPrompt } from '../utils/buildGptPrompt.ts'; // Prompt fonksiyonunu dışarı al

export const analyzeWithGPT = async (
  input: GPTAnalysisInput,
  model = 'gpt-4o'
): Promise<GPTAnalysisOutput> => {
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

    // Olası codeblock ve markdown temizliği
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed: GPTAnalysisOutput = JSON.parse(cleaned);

    // Basit zorunlu alan kontrolü (gerekirse özelleştir)
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
