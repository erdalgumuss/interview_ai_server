import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const downloadVideo = async (videoUrl: string, pipelineId: any): Promise<string> => {
    console.log('Job data:', videoUrl);

  if (!videoUrl.startsWith('https://')) {
    throw new Error('Only HTTPS video URLs are allowed for security reasons.');
  }

  const fileName = `video_${uuidv4()}.mp4`;
  const filePath = path.resolve('/tmp', fileName);
  const writer = fs.createWriteStream(filePath);

  try {
    const head = await axios.head(videoUrl);
    const contentLength = Number(head.headers['content-length']);
    const maxSize = 500 * 1024 * 1024; // 500 MB

    if (isNaN(contentLength) || contentLength > maxSize) {
      throw new Error(`Video size exceeds limit (${(contentLength / 1024 / 1024).toFixed(2)} MB)`);
    }

    const response = await axios.get(videoUrl, { responseType: 'stream' });
    response.data.pipe(writer);
  } catch (error: any) {
    throw new Error(`Video download failed: ${error?.message || error}`);
  }

  await new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return filePath;
};
