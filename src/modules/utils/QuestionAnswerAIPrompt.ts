// src/modules/utils/QuestionAnswerAIPrompt.ts

export interface QuestionAnswerAIResult {
  answerRelevanceScore: number;   // 0-100
  keywordCoverageScore: number;   // 0-100
  technicalScore: number;         // 0-100
  clarityScore: number;           // 0-100
  completenessScore: number;      // 0-100
  initiativeScore: number;        // 0-100
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  notes?: string;
}

export interface QuestionAIInput {
  questionText: string;
  expectedAnswer: string;
  keywords: string[];
  aiMetadata: {
    complexityLevel?: string;
    requiredSkills?: string[];
  };
  transcript: string;
}

export function buildQuestionAnswerAIPrompt(input: QuestionAIInput): string {
  return `
Aşağıda bir adayın mülakat sorusuna verdiği cevabın transkripti, sorunun beklenen cevabı, açıklaması ve anahtar kelimeleri verilmiştir.
Her bir alanı objektif olarak 0-100 arasında puanla. 
İnisiyatif puanı, adayın cevabında özgünlük, alternatif düşünce, yaratıcı yaklaşım veya kendi katkısı olup olmadığını değerlendirir.
Her alan için kısa açıklamalar ve notlar ekle.

SADECE şu formatta **geçerli bir JSON** üret, açıklama veya kod bloğu kullanma:

{
  "answerRelevanceScore": 0-100,
  "keywordCoverageScore": 0-100,
  "technicalScore": 0-100,
  "clarityScore": 0-100,
  "completenessScore": 0-100,
  "initiativeScore": 0-100,
  "strengths": [""],
  "weaknesses": [""],
  "recommendation": "",
  "notes": ""
}

### Soru:
${input.questionText}

### Beklenen Cevap:
${input.expectedAnswer}

### Anahtar Kelimeler:
${input.keywords.join(', ')}

### Zorluk: ${input.aiMetadata.complexityLevel || 'Belirtilmedi'}
### Gerekli Yetenekler: ${(input.aiMetadata.requiredSkills || []).join(', ') || 'Belirtilmedi'}

### Adayın Cevabı (Transkript):
${input.transcript}

Her puan alanını yukarıdaki tanıma göre doldur. JSON dışında hiçbir şey ekleme.
`.trim();
}
