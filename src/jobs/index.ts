// src/jobs/index.ts
import '../workers/videoDownloadWorker.ts';
import '../workers/audioExtractorWorker.ts';
import '../workers/transcriptionWorker.ts';
import '../workers/inputNormalizerWorker.ts';
import '../workers/gptAnalysisWorker.ts';
import '../workers/scoreCalculatorWorker.ts';
import '../workers/resultSaverWorker.ts';
import '../workers/cleanupWorker.ts';

// Not: Her worker dosyası sonsuz döngü ile poll ettiği için,
// sadece import etmek yeterli, hepsi paralel başlar.
console.log('All workers started.');
