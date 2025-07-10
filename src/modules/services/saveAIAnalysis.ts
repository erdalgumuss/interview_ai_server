// src/modules/services/saveAIAnalysis.ts

import { AnalysisJobModel } from '../models/AnalysisJob.model.ts';
import { VideoAnalysisModel } from '../models/VideoAnalysis.model.ts';

export const saveAIAnalysis = async (jobId: string, analysisResult: any) => {
  await VideoAnalysisModel.create({
    jobId,
    ...analysisResult // tüm score/feedback/result
  });

  // Pipeline adımını 'results_saved' olarak güncelle
  await AnalysisJobModel.updateOne({ jobId }, { $set: { "pipelineSteps.results_saved": "done", status: "done" } });
};









// import { AIAnalysisModel } from '../models/AIAnalysisModel.ts';



// export const saveAIAnalysisResult = async ({
//     videoResponseId,
//     applicationId,
//     transcription,
//     gptResult,
//     faceResult,
//     voiceResult,
//     overallScore,
//     communicationScore,
//   }: {
//     videoResponseId: string;
//     applicationId: string;
//     transcription: string;
//     gptResult: any;
//     faceResult: {
//       engagementScore: number;
//       confidenceScore: number;
//       emotionLabel: string;
//     };
//     voiceResult: {
//       speechFluencyScore: number;
//       voiceConfidenceScore: number;
//       voiceEmotionLabel: string;
//       speechRate: number;
//       averagePause: number;
//       totalPauses: number;
//     };
//     overallScore: number;
//     communicationScore: number;
//   }) => {
//     const aiAnalysisDoc = await AIAnalysisModel.create({
//       applicationId,
//       transcriptionText: transcription,
//       overallScore,
//       communicationScore,
//       answerRelevanceScore: gptResult.answerRelevanceScore,
//       skillFitScore: gptResult.skillFitScore,
//       backgroundFitScore: gptResult.backgroundFitScore,
//       keywordMatches: gptResult.keywordMatches,
//       strengths: gptResult.strengths,
//       improvementAreas: gptResult.improvementAreas,
//       recommendation: gptResult.recommendation,
//       engagementScore: faceResult.engagementScore,
//       confidenceScore: faceResult.confidenceScore,
//       faceEmotionLabel: faceResult.emotionLabel,
//       speechFluencyScore: voiceResult.speechFluencyScore,
//       voiceConfidenceScore: voiceResult.voiceConfidenceScore,
//       voiceEmotionLabel: voiceResult.voiceEmotionLabel,
//       speechRate: voiceResult.speechRate,
//       averagePause: voiceResult.averagePause,
//       totalPauses: voiceResult.totalPauses,
//       analyzedAt: new Date(),
//       version: 'v1',
//     });
//   /*
//     const updated = await VideoResponseModel.findByIdAndUpdate(
//       videoResponseId,
//       {
//         status: 'processed',
//         aiAnalysisId: aiAnalysisDoc._id,
//       },
//       { new: true }
//     );
  
//     if (!updated) {
//       console.warn(`⚠️ VideoResponse ${videoResponseId} not found during analysis linking.`);
//     }
//   */
//     console.log(`✅ AI analysis saved for video ${videoResponseId}`);
//     return aiAnalysisDoc;

//   };
  