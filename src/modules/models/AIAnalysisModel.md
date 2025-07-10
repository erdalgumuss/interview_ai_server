import mongoose, { Schema, Document } from 'mongoose';

export interface IAIAnalysis extends Document {
  applicationId: mongoose.Types.ObjectId;
  questionId?: mongoose.Types.ObjectId;
  transcriptionText: string;
  overallScore: number;
  communicationScore: number;

  // GPT sonuçları
  answerRelevanceScore: number;
  skillFitScore: number;
  backgroundFitScore: number;
  keywordMatches: string[];
  strengths: string[];
  improvementAreas: { area: string; recommendation: string }[];
  recommendation: string;
  rawGptOutput?: any;

  // Yüz ve ses analizleri
  engagementScore: number;
  confidenceScore: number;
  faceEmotionLabel: string;
  voiceConfidenceScore: number;
  speechFluencyScore: number;
  voiceEmotionLabel: string;
  speechRate?: number;
  averagePause?: number;
  totalPauses?: number;

  analysisVersion: string;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    transcriptionText: { type: String, required: true },
    overallScore: { type: Number, required: true },
    communicationScore: { type: Number, required: true },

    answerRelevanceScore: { type: Number, required: true },
    skillFitScore: { type: Number },
    backgroundFitScore: { type: Number },
    keywordMatches: [{ type: String }],
    strengths: [{ type: String }],
    improvementAreas: [
      {
        area: { type: String },
        recommendation: { type: String },
      },
    ],
    recommendation: { type: String },
    rawGptOutput: { type: Schema.Types.Mixed },

    engagementScore: { type: Number },
    confidenceScore: { type: Number },
    faceEmotionLabel: { type: String },
    voiceConfidenceScore: { type: Number },
    speechFluencyScore: { type: Number },
    voiceEmotionLabel: { type: String },
    speechRate: { type: Number },
    averagePause: { type: Number },
    totalPauses: { type: Number },

    analysisVersion: { type: String, default: 'v1' },
    analyzedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

AIAnalysisSchema.index({ applicationId: 1, questionId: 1 });

export const AIAnalysisModel = mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);
