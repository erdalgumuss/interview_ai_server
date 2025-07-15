//VideoAnalysisPipelineJob.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import type { VideoAnalysisPipelineJob, PipelineStep } from '../types/VideoAnalysisPipelineJob.ts';

const PipelineStepSchema = new Schema<PipelineStep>({
  state:      { type: String, enum: ['pending','in_progress', 'waiting', 'done','error'], required: true },
  startedAt:  { type: String },
  finishedAt: { type: String },
  error:      { type: String },
  details:    { type: Schema.Types.Mixed }
}, { _id: false });

const VideoAnalysisPipelineJobSchema = new Schema<VideoAnalysisPipelineJob>({
  meta:         { type: Schema.Types.Mixed, required: true },
  application:  { type: Schema.Types.Mixed, required: true },
  interviewId:  { type: String, required: true },
  interviewTitle: { type: String },
  questionId:   { type: String, required: true },
  order:        { type: Number, default: 0 },
  duration:     { type: Number, default: 0 },
  videoResponseId: { type: String, required: true },
  videoUrl:     { type: String, required: true },
  questionText: { type: String },
  expectedAnswer: { type: String },
  keywords:     { type: [String] },
  aiMetadata:   { type: Schema.Types.Mixed },

pipelineSteps: {
  type: {
    video_downloaded: PipelineStepSchema,
    audio_extracted: PipelineStepSchema,
    transcribed: PipelineStepSchema,
    face_analyzed: PipelineStepSchema,
    voice_analyzed: PipelineStepSchema,
    gpt_analyzed: PipelineStepSchema,
    final_scored: PipelineStepSchema,
    results_saved: PipelineStepSchema
  },
  required: true,
  default: () => ({
    video_downloaded: { state: 'pending' },
    audio_extracted: { state: 'pending' },
    transcribed: { state: 'pending' },
    input_normalized: { state: 'pending' },
    face_analyzed: { state: 'pending' },
    voice_analyzed: { state: 'pending' },
    gpt_analyzed: { state: 'pending' },
    final_scored: { state: 'pending' },
    results_saved: { state: 'pending' }
  }),
},
  status:      { type: String, enum: ['queued','in_progress','done','failed'], default: 'queued' },
  error:       { type: String },
  priority:    { type: Number, default: 3 },
  timeoutMs:   { type: Number, default: 180000 },
  retries:     { type: Number, default: 0 },
  startedAt:   { type: String },
  finishedAt:  { type: String },

  // Diğer step çıktıları veya özetler
  videoPath:   { type: String },
  audioPath:   { type: String },
  transcription: { type: Schema.Types.Mixed },
  normalizedInput: { type: Schema.Types.Mixed },
  aiResult:    { type: Schema.Types.Mixed },
  faceScores:  { type: Schema.Types.Mixed },
  voiceScores: { type: Schema.Types.Mixed },
  gptFeedback: { type: Schema.Types.Mixed },
  overallScore: { type: Number },
  savedAnalysisId: { type: String }
}, { timestamps: true });

export const VideoAnalysisPipelineJobModel = mongoose.model<VideoAnalysisPipelineJob & Document>(
  'VideoAnalysisPipelineJob',
  VideoAnalysisPipelineJobSchema
);
