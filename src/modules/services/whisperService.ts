import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: WhisperWord[];
}

export interface WhisperResponse {
  text: string;
  words?: WhisperWord[];
  segments?: WhisperSegment[];
  language?: string;
  duration?: number;
}

export const getTranscription = async (filePath: string): Promise<WhisperResponse> => {
  const allowedExtensions = ['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.ogg'];
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Unsupported audio format: ${ext}. Allowed formats: ${allowedExtensions.join(', ')}`);
  }


  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('model', 'whisper-1');
  form.append('language', 'tr');
  form.append('response_format', 'verbose_json');
  // Fix: Pass timestamp_granularities as comma-separated string
  form.append('timestamp_granularities[]', 'word');
  form.append('timestamp_granularities[]', 'segment');
  form.append('prompt', 'Bu bir iş mülakatı cevabıdır.');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        timeout: 60000,
      }
    );

    const { text, words, segments, language, duration } = response.data;

    if (Array.isArray(words) && words.length > 0) {
      const avgConfidence = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;
      console.log('✅ Whisper transcription completed.');
      console.log(`🧠 Confidence Avg: ${avgConfidence.toFixed(2)} | Word Count: ${words.length}`);
      console.log(`🕒 Duration: ${duration?.toFixed(2)}s | Language: ${language}`);
    } else {
      console.warn('⚠️ Whisper response has no top-level words array. Trying to fallback to segments...');
    }

    // Fallback: Merge words from segments if top-level `words` is missing
    const fallbackWords = (!words || words.length === 0) && Array.isArray(segments)
      ? segments.flatMap((seg) => seg.words || [])
      : words;

    return {
      text,
      words: fallbackWords,
      segments,
      language,
      duration
    };
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error('❌ Whisper API error:', msg);
    throw new Error(`Whisper transcription failed: ${msg}`);
  }
};
