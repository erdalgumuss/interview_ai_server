export const normalizeAnalysisInput = (jobData: any, transcription: string) => {
    const q = jobData.question || {};
    const c = jobData.candidate || {};
    const p = jobData.personalityTest?.scores || {};
  
    return {
      questionText: q.questionText || '',
      expectedAnswer: q.expectedAnswer || '',
      keywords: q.keywords || [],
      complexityLevel: q.aiMetadata?.complexityLevel || '',
      requiredSkills: q.aiMetadata?.requiredSkills || [],
  
      candidateSkills: c.skills?.technical || [],
      candidateExperience: c.experience?.map(
        (e: any) => `${e.company}: ${e.responsibilities}`
      ) || [],
      candidateEducation: c.education?.map(
        (e: any) => `${e.school} (${e.degree}, ${e.graduationYear})`
      ) || [],
  
      personalityScores: p,
      personalityFit: jobData.personalityTest?.personalityFit || null,
  
      transcript: transcription || '',
    };
  };
  