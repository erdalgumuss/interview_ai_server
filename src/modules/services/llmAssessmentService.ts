// src/modules/services/llmAssessmentService.ts

import axios from 'axios';
import type { LLMGeneralAssessment } from '../../types/AnalysisScore.ts';

export async function getLLMGeneralAssessment(input: any): Promise<LLMGeneralAssessment> {
  const prompt = `
Aşağıda bir adayın mülakat sorusu için detaylı analiz puanları ve açıklamalar verilmiştir.
Lütfen IK bakış açısıyla aşağıdaki başlıkları özetle:
- Puanların neden verildiğini, hangi parametrelerin hangi oranda etkili olduğunu,
- Her skorun güvenilirliğini ve varsa uyarıları,
- Geliştirme önerilerini ve genel tavsiyeleri,
- Son bir genel değerlendirme ve kısa puan özetini.

Tüm çıktıyı sade, etikete bağlı ve JSON olarak döndür (örneğe uygun):

{
  "overallAssessment": "",
  "faceAnalysisSummary": "",
  "voiceAnalysisSummary": "",
  "llmAnalysisSummary": "",
  "finalScore": ...,
  "breakdown": { "face": ..., "voice": ..., "llm": ... },
  "recommendation": "",
  "improvementSuggestions": [""],
  "reliability": true/false
}

### Soru: ${input.questionText}
### Beklenen Yanıt: ${input.expectedAnswer}
### Anahtar Kelimeler: ${input.keywords.join(', ')}
### Aday: ${input.candidate?.name} ${input.candidate?.surname}
### Akademik Skorlar: ${JSON.stringify(input.academicScores)}
### Analiz Breakdown: ${JSON.stringify(input.analysisBreakdown)}
### Açıklama Politikası: ${input.explanationPolicy}
  `.trim();

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a top HR specialist. Return only pure JSON, no extra explanations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const content = res.data.choices[0].message?.content?.replace(/```json|```/g, '').trim();
  return JSON.parse(content);
}
