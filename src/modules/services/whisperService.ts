// services/whisperService.ts

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

/** Whisper word structure */
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
  words: WhisperWord[];
  segments: WhisperSegment[];
  language: string;
  duration: number;
  meta: {
    avgWordConfidence: number;
    totalWords: number;
    segmentCount: number;
    createdAt: string;
    fileName: string;
    model: string;
    prompt: string;
  };
}

/**
 * Whisper transcribe audio with OpenAI API (verbose JSON, word and segment timing).
 * Returns a normalized structure for advanced prosody/voice analysis.
 */
export async function getTranscription(filePath: string, opts?: { language?: string, prompt?: string }): Promise<WhisperResponse> {
  const allowedExtensions = ['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.ogg'];
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Unsupported audio format: ${ext}. Allowed formats: ${allowedExtensions.join(', ')}`);
  }
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const language = opts?.language || 'tr';
  const prompt = opts?.prompt || 'Bu bir iş mülakatı cevabıdır.';

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('model', 'whisper-1');
  form.append('language', language);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('timestamp_granularities[]', 'segment');
  form.append('prompt', prompt);

  let apiResp;
  try {
    apiResp = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        timeout: 120_000, // Daha uzun dosya için timeout yüksek olsun
      }
    );
  } catch (error: any) {
    const msg = error?.response?.data?.error?.message || error?.message || String(error);
    throw new Error(`Whisper API error: ${msg}`);
  }

  // Extraction & normalization
  const { text, words, segments, language: detectedLang, duration } = apiResp.data;
  // Fallback: Merge words from segments if top-level `words` is missing (bazı dosyalarda eksik gelebilir!)
  let allWords: WhisperWord[] = [];
  if (Array.isArray(words) && words.length > 0) {
    allWords = words;
  } else if (Array.isArray(segments)) {
    allWords = segments.flatMap((seg) => seg.words || []);
  }
  // Defensive: type check + sort by start time
  allWords = (allWords ?? []).filter(w => w?.word && typeof w.start === 'number').sort((a, b) => a.start - b.start);

  // Meta analytics
  const avgWordConfidence = allWords.length
    ? allWords.reduce((sum, w) => sum + (w.confidence || 0), 0) / allWords.length
    : 0;

  const out: WhisperResponse = {
    text: text ?? '',
    words: allWords,
    segments: segments ?? [],
    language: detectedLang ?? language,
    duration: typeof duration === 'number' ? duration : (allWords.length ? (allWords[allWords.length - 1].end - allWords[0].start) : 0),
    meta: {
      avgWordConfidence: Number(avgWordConfidence.toFixed(3)),
      totalWords: allWords.length,
      segmentCount: Array.isArray(segments) ? segments.length : 0,
      createdAt: new Date().toISOString(),
      fileName: path.basename(filePath),
      model: 'whisper-1',
      prompt,
    },
  };

  // Logging (isteğe bağlı JSON.stringify(out.meta))
  console.log(`[Whisper] ✅ Transcribed '${out.meta.fileName}' (${out.language}) - Words: ${out.meta.totalWords} | Avg conf: ${out.meta.avgWordConfidence}`);

  return out;
}
