import mongoose, { Schema, Document } from 'mongoose';
import type { InterviewRecord } from '../types/InterviewRecord.ts';

const InterviewRecordSchema = new Schema<InterviewRecord>({
  meta:         { type: Schema.Types.Mixed, required: true },
  application:  { type: Schema.Types.Mixed, required: true },
  interview: {
    id:     { type: String, required: true },
    title:  { type: String },
    questions: [{
      id:           { type: String, required: true },
      order:        { type: Number },
      duration:     { type: Number },
      questionText: { type: String },
      expectedAnswer: { type: String },
      keywords:     { type: [String] },
      aiMetadata:   { type: Schema.Types.Mixed },
      videoResponseId: { type: String },
      videoUrl:     { type: String },
      pipelineId:   { type: String }
    }]
  },
  overallScore: { type: Number },
  finalReport:  { type: Schema.Types.Mixed },
  status:       { type: String, enum: ['queued','in_progress','done','failed'], default: 'queued' },
  startedAt:    { type: String },
  finishedAt:   { type: String },
  error:        { type: String }
}, { timestamps: true });

export const InterviewRecordModel = mongoose.model<InterviewRecord & Document>(
  'InterviewRecord',
  InterviewRecordSchema
);
