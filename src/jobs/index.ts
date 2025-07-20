// src/jobs/index.ts


// Her worker'ı import et
import '../modules/worker/videoDownload.worker.ts';
import '../modules/worker/audioExtract.worker.ts';
import '../modules/worker/transcription.worker.ts';
import '../modules/worker/faceAnalysis.worker.ts';
import '../modules/worker/voiceAnalysis.worker.ts';
import '../modules/worker/questionAnswerAI.worker.ts';
import '../modules/worker/gptAnalysis.worker.ts';
import '../modules/worker/scoreCalculate.worker.ts';
//import '../modules/worker/resultSave.worker.ts';

// Eğer workerlar class olarak OOP şeklinde ise ve new ile başlatılıyorsa:
//
// import { VideoDownloadWorker } from '../modules/worker/videoDownload.worker.ts';
// import { AudioExtractWorker } from '../modules/worker/audioExtract.worker.ts';
// ... vs ...
//
// new VideoDownloadWorker();
// new AudioExtractWorker();
// ... vs ...

console.log('🚀 All BullMQ workers started.');
