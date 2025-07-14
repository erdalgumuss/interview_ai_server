// src/modules/services/gptService.ts

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import { GPTResult, AnalyzeInput } from '../../types/aiAnalysis.types.ts'; // TİPLERİ TİPLER DOSYANDAN AL

import { buildGptPrompt } from '../utils/buildGptPrompt.ts'; // Prompt fonksiyonunu dışarı al

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

    // Markdown, codeblock vs olursa temizle
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Tip kontrolü (zorunlu alanlar için)
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
