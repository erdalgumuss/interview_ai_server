// src/modules/utils/buildGptPrompt.ts

import { AnalyzeInput } from '../../types/aiAnalysis.types.ts';

export const buildGptPrompt = (input: AnalyzeInput): string => {
  return `
You are a professional AI interview evaluator. Analyze the candidate's video interview answer.

Use all available context below and respond ONLY with raw JSON. No markdown, explanation or code blocks.

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
};
