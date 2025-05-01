import axios from 'axios';

interface AnalyzeInput {
  questionText: string;
  expectedAnswer: string;
  keywords: string[];
  complexityLevel: string;
  requiredSkills: string[];
  candidateSkills: string[];
  candidateExperience: string[];
  candidateEducation: string[];
  personalityScores: Record<string, number>;
  personalityFit?: number;
  transcript: string;
}

export const analyzeWithGPT = async (input: AnalyzeInput) => {
  const prompt = `
You are a professional AI interview evaluator. Analyze the candidate's video interview answer.

Use all available context below and return a valid **raw JSON** (no markdown or explanation).

---

📌 Question:
"${input.questionText}"

📌 Expected Answer:
"${input.expectedAnswer}"

📌 Keywords:
${JSON.stringify(input.keywords)}

📌 Complexity Level:
${input.complexityLevel}

📌 Required Skills:
${JSON.stringify(input.requiredSkills)}

---

🧠 Transcript:
"${input.transcript}"

---

👤 Candidate Profile:
- Skills: ${JSON.stringify(input.candidateSkills)}
- Experience: ${JSON.stringify(input.candidateExperience)}
- Education: ${JSON.stringify(input.candidateEducation)}
- Personality Scores: ${JSON.stringify(input.personalityScores)}
- Personality Fit Score: ${input.personalityFit ?? 'N/A'}

---

🎯 Respond ONLY with raw JSON like:
{
  "answerRelevanceScore": number,
  "skillFitScore": number,
  "backgroundFitScore": number,
  "keywordMatches": [string],
  "strengths": [string],
  "improvementAreas": [{ "area": string, "recommendation": string }],
  "recommendation": string
}
`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an AI that only returns valid raw JSON without markdown, code blocks, or commentary.'
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
          'Content-Type': 'application/json',
        }
      }
    );

    const content: string = response.data.choices[0].message?.content;
    if (!content) throw new Error('Empty GPT response');

    const cleaned = content
      .replace(/```json\s*|```/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error('❌ GPT analiz hatası:', err?.response?.data || err.message);
    throw new Error('GPT yanıtı geçerli JSON değil veya API başarısız oldu.');
  }
};
