import { videoAnalysisQueue } from '../videoAnalysis/videoAnalysisQueue.ts';
import { updateJobStatus } from './updateJobStatus.ts'; // Redis'e yazan util

interface VideoAnalysisJobData {
  videoUrl: string;
  applicationId: string;
  questionId?: string;
  interviewId?: string;
}

export const addVideoAnalysisJob = async (data: VideoAnalysisJobData) => {
  const job = await videoAnalysisQueue.add('analyze-video', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  });

  if (!job.id) throw new Error('Job ID is undefined');

  // **Başlangıçta tüm pipeline flag'lerini False olarak set et!**
  // Status hash'i pipeline'daki tüm adımları gösteriyor:
  await updateJobStatus(job.id, 'queued', {
  video_downloaded: 'pending',
  audio_extracted: 'pending',
  transcribed: 'pending',
  face_analyzed: 'pending',
  voice_analyzed: 'pending',
  gpt_analyzed: 'pending',
  final_scored: 'pending',
  results_saved: 'pending',
  error: '', // Boş string, null değil!
});


  console.log(`📥 Job enqueued: ID=${job.id}, App=${data.applicationId}`);
  return job.id;
};
