import { normalizeTimeline } from '../modules/services/timelineNormalizer.ts';

const words = [
  { word: "Merhaba", start: 0.5, end: 1.2 },
  { word: "ben", start: 1.3, end: 1.5 },
  { word: "Ali", start: 1.5, end: 1.8 },
  { word: "React'te", start: 2.0, end: 2.7 },
  { word: "useEffect", start: 2.7, end: 3.4 },
  { word: "hook'unu", start: 3.4, end: 4.0 },
  { word: "açıklayacağım", start: 4.1, end: 5.2 },
  { word: "Side", start: 5.3, end: 5.7 },
  { word: "effect", start: 5.7, end: 6.2 },
  { word: "yönetimi", start: 6.3, end: 7.1 },
];

const faceFrames = [
  { time: 0.5, emotion: "happy", confidence: 0.82, engagement: 0.75 },
  { time: 1.0, emotion: "surprised", confidence: 0.65, engagement: 0.7 },
  { time: 1.5, emotion: "neutral", confidence: 0.78, engagement: 0.68 },
  { time: 2.0, emotion: "concentrated", confidence: 0.84, engagement: 0.8 },
  { time: 2.5, emotion: "concentrated", confidence: 0.81, engagement: 0.79 },
  { time: 3.0, emotion: "confused", confidence: 0.72, engagement: 0.6 },
  { time: 3.5, emotion: "confused", confidence: 0.69, engagement: 0.58 },
  { time: 4.0, emotion: "neutral", confidence: 0.76, engagement: 0.65 },
  { time: 4.5, emotion: "neutral", confidence: 0.79, engagement: 0.67 },
  { time: 5.0, emotion: "happy", confidence: 0.88, engagement: 0.77 },
  { time: 5.5, emotion: "happy", confidence: 0.85, engagement: 0.79 },
  { time: 6.0, emotion: "surprised", confidence: 0.68, engagement: 0.66 },
  { time: 6.5, emotion: "concentrated", confidence: 0.9, engagement: 0.85 },
  { time: 7.0, emotion: "concentrated", confidence: 0.87, engagement: 0.84 },
  { time: 7.5, emotion: "confident", confidence: 0.91, engagement: 0.88 },
  { time: 8.0, emotion: "confident", confidence: 0.89, engagement: 0.86 },
  { time: 8.5, emotion: "confused", confidence: 0.74, engagement: 0.6 },
  { time: 9.0, emotion: "sad", confidence: 0.65, engagement: 0.5 },
  { time: 9.5, emotion: "neutral", confidence: 0.7, engagement: 0.58 },
  { time: 10.0, emotion: "calm", confidence: 0.8, engagement: 0.65 }
];


const result = normalizeTimeline(words, faceFrames);
console.log(JSON.stringify(result, null, 2));
