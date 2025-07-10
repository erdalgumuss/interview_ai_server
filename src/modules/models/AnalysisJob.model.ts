// src/modules/models/AnalysisJob.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export type PipelineStepState = 'pending' | 'in_progress' | 'done' | 'error';

export interface IAnalysisJob extends Document {
  jobId: string;                       // BullMQ jobId (string)
  requestId: string;                   // App-backend log takibi
  applicationId: string;               // Gevşek bağlı string ID
  videoResponseId: string;
  questionId: string;
  status: 'queued' | 'in_progress' | 'done' | 'failed';

  pipelineSteps: {
    video_downloaded: PipelineStepState;
    audio_extracted:  PipelineStepState;
    transcribed:      PipelineStepState;
    face_analyzed:    PipelineStepState;
    voice_analyzed:   PipelineStepState;
    gpt_analyzed:     PipelineStepState;
    final_scored:     PipelineStepState;
    results_saved:    PipelineStepState;
    error: string;
  };

  priority: number;
  timeoutMs: number;
  retries: number;
  startedAt?: Date;
  finishedAt?: Date;
}

const stepDefault = { type: String, enum: ['pending','in_progress','done','error'], default: 'pending' };

const AnalysisJobSchema = new Schema<IAnalysisJob>(
  {
    jobId:            { type: String, required: true, index: true },
    requestId:        { type: String, required: true },
    applicationId:    { type: String, required: true, index: true },
    videoResponseId:  { type: String, required: true, index: true },
    questionId:       { type: String, required: true },

    status: { type: String, enum: ['queued','in_progress','done','failed'], default: 'queued' },

    pipelineSteps: {
      video_downloaded: stepDefault,
      audio_extracted:  stepDefault,
      transcribed:      stepDefault,
      face_analyzed:    stepDefault,
      voice_analyzed:   stepDefault,
      gpt_analyzed:     stepDefault,
      final_scored:     stepDefault,
      results_saved:    stepDefault,
      error:            { type: String, default: '' }
    },

    priority:   { type: Number, default: 3 },
    timeoutMs:  { type: Number, default: 180000 },
    retries:    { type: Number, default: 0 },
    startedAt:  Date,
    finishedAt: Date
  },
  { timestamps: true }
);

AnalysisJobSchema.index({ applicationId: 1, videoResponseId: 1 }, { unique: true });

export const AnalysisJobModel = mongoose.model<IAnalysisJob>('AnalysisJob', AnalysisJobSchema);
