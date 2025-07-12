import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Belirtilen video dosyasından ses dosyası çıkarır.
 * @param videoPath - Kaynak video dosyasının tam yolu
 * @param outputDir - Ses dosyasının kaydedileceği klasör (varsayılan: /tmp)
 * @returns Çıkarılan ses dosyasının tam yolu
 */
export const extractAudioFromVideo = (
  videoPath: string,
  outputDir: string = '/tmp'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`Video dosyası bulunamadı: ${videoPath}`));
    }

    const fileName = `audio_${uuidv4()}.mp3`;
    const audioPath = path.resolve(outputDir, fileName);

    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .format('mp3')
      .save(audioPath)
      .on('start', (commandLine) => {
        console.log('🔧 ffmpeg başlatıldı:', commandLine);
      })
      .on('end', () => {
        console.log('🎵 Audio extraction completed:', audioPath);
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error('⚠️ Audio extraction failed:', err.message);
        reject(new Error(`Audio extraction failed: ${err.message}`));
      });
  });
};
