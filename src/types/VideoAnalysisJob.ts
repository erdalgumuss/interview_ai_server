// types/VideoAnalysisJob.ts
export interface VideoAnalysisJob {
    videoResponseId: string;
    applicationId: string;
    interviewId: string;
    videoUrl: string;
    question: Question;
    candidate: Candidate;
    personalityTest?: PersonalityTest;
}

interface Question {
    questionId: string;
    questionText: string;
    expectedAnswer: string;
    keywords: string[];
    order: number;
    duration: number;
    aiMetadata: {
        complexityLevel: 'easy' | 'medium' | 'hard';
        requiredSkills: string[];
    };
}

interface Candidate {
    name: string;
    surname: string;
    email: string;
    education: Education[];
    experience: Experience[];
    skills: {
        technical: string[];
        personal: string[];
        languages: Language[];
    };
    documents: {
        resume: string;
    };
}

interface Education {
    school: string;
    degree: string;
    graduationYear: number;
}

interface Experience {
    company: string;
    position: string;
    duration: string;
    responsibilities: string;
}

interface Language {
    name: string;
    level: string;
}

interface PersonalityTest {
    completed: boolean;
    scores: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
    };
    personalityFit: number;
}
