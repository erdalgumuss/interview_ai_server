// applicationSubmission.model.ts

import mongoose, { Schema, Document } from 'mongoose';

// --- Candidate Sub-Schema ---
const CandidateSchema = new Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  education: [{
    school: String,
    degree: String,
    graduationYear: Number,
  }],
  experience: [{
    company: String,
    position: String,
    duration: String,
    responsibilities: String,
  }],
  skills: {
    technical: [String],
    personal: [String],
    languages: [{
      name: String,
      level: String,
    }]
  },
  documents: {
    resume: String,
    certificates: [String],
    socialMediaLinks: [{
      platform: String,
      url: String,
    }]
  }
}, { _id: false });

// --- Personality Test Sub-Schema ---
const PersonalityTestSchema = new Schema({
  completed: Boolean,
  scores: {
    openness: Number,
    conscientiousness: Number,
    extraversion: Number,
    agreeableness: Number,
    neuroticism: Number
  },
  personalityFit: Number
}, { _id: false });

// --- Question Sub-Schema ---
const QuestionSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
  questionText: String,
  expectedAnswer: String,
  keywords: [String],
  order: Number,
  duration: Number,
  aiMetadata: Schema.Types.Mixed
}, { _id: false });

// --- AI Analysis Sub-Schema ---
const AiAnalysisSchema = new Schema({
  transcriptionText: String,
  overallScore: Number,
  technicalSkillsScore: Number,
  communicationScore: Number,
  problemSolvingScore: Number,
  personalityMatchScore: Number,
  keywordMatches: [String],
  strengths: [String],
  improvementAreas: [{
    area: String,
    recommendation: String
  }],
  engagementScore: Number,
  confidenceLevel: Number,
  speechFluency: Number,
  voiceConfidence: Number,
  emotion: String
}, { _id: false });

// --- Video Response Sub-Schema ---
const VideoResponseSchema = new Schema({
  videoResponseId: { type: String, required: true },
  questionId: { type: Schema.Types.ObjectId, required: true, ref: 'Question' },
  videoUrl: String,
  aiAnalysis: { type: AiAnalysisSchema, default: null },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }
}, { _id: false });

// --- Interview Info Sub-Schema ---
const InterviewSchema = new Schema({
  title: String,
  expirationDate: Date,
  stages: {
    personalityTest: Boolean,
    questionnaire: Boolean
  },
  questions: [QuestionSchema]
}, { _id: false });

// --- Main Application Submission Schema ---
export interface IVideoResponse {
  videoResponseId: string;
  questionId: mongoose.Types.ObjectId;
  videoUrl?: string;
  aiAnalysis?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface IApplicationSubmission extends Document {
  applicationId: mongoose.Types.ObjectId;
  interviewId: mongoose.Types.ObjectId;
  candidate: any;
  personalityTest?: any;
  interview: any;
  videoResponses: IVideoResponse[];
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSubmissionSchema = new Schema<IApplicationSubmission>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  interviewId: { type: Schema.Types.ObjectId, ref: 'Interview', required: true },
  candidate: { type: CandidateSchema, required: true },
  personalityTest: PersonalityTestSchema,
  interview: InterviewSchema,
  videoResponses: [VideoResponseSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ApplicationSubmissionSchema.index({ applicationId: 1, interviewId: 1 });

export const ApplicationSubmissionModel = mongoose.model<IApplicationSubmission>(
  'ApplicationSubmission',
  ApplicationSubmissionSchema
);
