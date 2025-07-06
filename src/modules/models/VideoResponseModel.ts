//videoResponseModel.ts
// This file defines the Mongoose model for video responses in the application.

import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoResponse extends Document {
  videoUrl: string;
  applicationId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  durationSeconds?: number;
  processingAttempts: number;
  status: 'pending' | 'downloading' | 'analyzing' | 'processed' | 'failed';
  failureReason?: string;
  aiAnalysisId?: mongoose.Types.ObjectId;
  analysisDurationMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const VideoResponseSchema = new Schema<IVideoResponse>(
  {
    videoUrl: { type: String, required: true },
    applicationId: { type: Schema.Types.ObjectId, required: true, ref: 'Application' },
    questionId: { type: Schema.Types.ObjectId, required: true, ref: 'Question' },
    durationSeconds: { type: Number },
    processingAttempts: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'downloading', 'analyzing', 'processed', 'failed'],
      default: 'pending',
    },
    failureReason: { type: String, default: null },
    aiAnalysisId: { type: Schema.Types.ObjectId, ref: 'AIAnalysis' },
    analysisDurationMs: { type: Number },
  },
  {
    timestamps: true,
  }
);

VideoResponseSchema.index({ applicationId: 1, status: 1 });

export const VideoResponseModel = mongoose.model<IVideoResponse>('VideoResponse', VideoResponseSchema);
