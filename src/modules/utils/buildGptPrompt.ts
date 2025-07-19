import { GPTAnalysisInput } from '../../types/aiAnalysis.types.ts';

export function buildGptPrompt(input: GPTAnalysisInput): string {
  return `
Aşağıda bir adayın mülakat sorusuna verdiği cevabın transkripti, adayın özgeçmişi, kişilik skorları, ses ve yüz analiz özetleri ile pozisyon için beklenen nitelikler verilmiştir.
Sen bir insan mülakat değerlendiricisi gibi davran, aşağıdaki başlıklarda puanlama ve detaylı analiz yap. Sadece geçerli ve biçimli JSON döndür.

{
  "answerRelevanceScore": 0-100,                 // Cevabın soruyla uyumu, anahtar noktaların karşılanma oranı
  "answerCoverage": "",                           // Kapsanan ve eksik anahtar noktalar
  "detectedKeywords": [""],                       // Tespit edilen anahtar kelimeler
  "strengths": [""],                              // Güçlü yönler
  "weaknesses": [""],                             // Gelişime açık noktalar
  "softSkillsAssessment": {                       // Her soft skill için 0-100 puan
    "communication": 0,
    "leadership": 0,
    "teamwork": 0,
    "problemSolving": 0
  },
  "technicalSkillsAssessment": {                  // Her teknik yetenek için 0-100 puan
    "architecture": 0,
    "programming": 0,
    "scalability": 0
  },
  "personalityAssessment": {                      // Kişilik skorları (Big Five vb.)
    "openness": 0,
    "conscientiousness": 0,
    "extraversion": 0,
    "agreeableness": 0,
    "neuroticism": 0
  },
  "voiceAnalysisSummary": {                       // Ses/konuşma analizi özet skorları
    "speechFluency": 0,
    "speechRate": 0,
    "averagePause": 0,
    "emotionDetected": ""
  },
  "faceAnalysisSummary": {                        // Yüz analizi özet skorları
    "attention": 0,
    "dominantEmotion": ""
  },
  "recommendation": "",                           // Nihai karar ve gelişim önerisi
  "overallScore": 0-100,                          // Genel başarı puanı
  "notes": ""                                     // Kısa, kişiye özel notlar
}

### Soru
${input.questionText}

### Beklenen Yanıt
${input.expectedAnswer}

### Anahtar Kelimeler
${input.keywords.join(', ')}

### Soru Zorluğu: ${input.complexityLevel}
### Gerekli Yetkinlikler: ${input.requiredSkills.join(', ')}

### Aday Özgeçmişi
- Teknik Yetkinlikler: ${input.candidateSkills.join(', ') || "Yok"}
- Deneyim: ${input.candidateExperience.join(', ') || "Yok"}
- Eğitim: ${input.candidateEducation.join(', ') || "Yok"}
- Sertifikalar: ${(input.documents || []).join(', ') || "Yok"}

### Kişilik Skorları: ${JSON.stringify(input.personalityScores)}
### Kişilik Uygunluk: ${input.personalityFit ?? 'N/A'}

### Ses Analizi:
${input.voiceProsody ? JSON.stringify(input.voiceProsody) : "Veri yok"}
${input.voiceEmotionScores ? "Voice emotions: " + JSON.stringify(input.voiceEmotionScores) : ""}
${input.dominantVoiceEmotion ? "Dominant voice emotion: " + input.dominantVoiceEmotion : ""}
${typeof input.energyMean === 'number' ? "Energy mean: " + input.energyMean : ""}
${typeof input.pitchMean === 'number' ? "Pitch mean: " + input.pitchMean : ""}
${typeof input.snrEstimate === 'number' ? "SNR estimate: " + input.snrEstimate : ""}

### Yüz Analizi:
${input.faceEmotionScores ? "Face emotions: " + JSON.stringify(input.faceEmotionScores) : ""}
${input.dominantFaceEmotion ? "Dominant face emotion: " + input.dominantFaceEmotion : ""}
${typeof input.attentionScore === 'number' ? "Attention score: " + input.attentionScore : ""}
${typeof input.eyeContactScore === 'number' ? "Eye contact score: " + input.eyeContactScore : ""}

### Cevap Transkripti:
${input.transcript}

Yalnızca geçerli, **açıklamalı JSON** dön; ekstra açıklama, markdown veya kod bloğu ekleme!
`.trim();
}
