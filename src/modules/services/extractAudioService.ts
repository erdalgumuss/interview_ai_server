import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const extractAudioFromVideo = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const audioPath = path.resolve('/tmp', `audio_${uuidv4()}.mp3`);

    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .format('mp3')
      .save(audioPath)
      .on('end', () => {
        console.log('🎵 Audio extraction completed:', audioPath);
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error('⚠️ Audio extraction failed', err.message);
        reject(new Error('Audio extraction failed: ' + err.message));
      });
  });
};
