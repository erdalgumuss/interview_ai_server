import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import { buildQuestionAnswerAIPrompt, QuestionAIInput, QuestionAnswerAIResult } from '../utils/QuestionAnswerAIPrompt.ts';

export async function analyzeQuestionAnswerWithLLM(
  input: QuestionAIInput,
  model = 'gpt-4o'
): Promise<QuestionAnswerAIResult> {
  const prompt = buildQuestionAnswerAIPrompt(input);

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
        temperature: 0.0 // Maksimum deterministik analiz için
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content: string = response.data.choices[0].message?.content;
    if (!content) throw new Error('Empty LLM response');

    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed: QuestionAnswerAIResult = JSON.parse(cleaned);

    // Basit zorunlu alan kontrolü (isteğe bağlı)
    if (
      typeof parsed.answerRelevanceScore !== 'number' ||
      typeof parsed.initiativeScore !== 'number'
    ) {
      throw new Error('Invalid JSON structure from LLM');
    }

    return parsed;
  } catch (err: any) {
    console.error('❌ LLM analiz hatası:', err?.response?.data || err.message);
    throw new Error('LLM yanıtı geçerli JSON değil veya API başarısız oldu.');
  }
}
