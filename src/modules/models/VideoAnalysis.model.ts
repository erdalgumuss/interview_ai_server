// src/models/VideoAnalysis.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoAnalysis extends Document {
  jobId: string;
  applicationId: string;
  videoResponseId: string;
  questionId: string;

  transcript: string;
  sentiment: 'positive' | 'neutral' | 'negative';

  keywordCoverage: number;       // 0–1
  matchingScore: number;         // 0–100

  faceScores: {
    attention: number;           // 0–1
    eyeContact: number;          // 0–1
    emotionDistribution: Record<string, number>; // { happy:0.4, sad:0.1, ... }
  };

  voiceScores: {
    pitchVar: number;            // örn. semitone std-dev
    speakingRate: number;        // wpm
    volumeStability: number;     // 0–1
  };

  gptFeedback: {
    strengths: string[];
    improvements: string[];
    overallComment: string;
  };

  overallScore: number;          // 0–100
  version: string;               // “v1.0.0”
}

const VideoAnalysisSchema = new Schema<IVideoAnalysis>(
  {
    jobId:           { type: String, required: true, index: true },
    applicationId:   { type: String, required: true, index: true },
    videoResponseId: { type: String, required: true, unique: true },
    questionId:      { type: String, required: true },

    transcript:        String,
    sentiment:         { type: String, enum: ['positive','neutral','negative'] },
    keywordCoverage:   Number,
    matchingScore:     Number,

    faceScores: {
      attention: Number,
      eyeContact: Number,
      emotionDistribution: { type: Schema.Types.Mixed, default: {} }
    },

    voiceScores: {
      pitchVar: Number,
      speakingRate: Number,
      volumeStability: Number
    },

    gptFeedback: {
      strengths:   [String],
      improvements:[String],
      overallComment: String
    },

    overallScore: Number,
    version:      { type: String, default: 'v1.0.0' }
  },
  { timestamps: true }
);

VideoAnalysisSchema.index({ applicationId: 1, questionId: 1 });

export const VideoAnalysisModel = mongoose.model<IVideoAnalysis>('VideoAnalysis', VideoAnalysisSchema);
