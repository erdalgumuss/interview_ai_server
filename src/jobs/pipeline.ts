// src/jobs/pipelineFlow.ts

import { FlowProducer } from 'bullmq';
import { redisConfig } from '../config/redis.ts';
import { VideoAnalysisPipelineJob } from '../types/VideoAnalysisPipelineJob.ts';

const flow = new FlowProducer({ connection: redisConfig });

export async function startVideoAnalysisPipeline(initialData: VideoAnalysisPipelineJob) {
  // Child-job chain örneği:
  return await flow.add({
    name: 'video-analysis-pipeline',
    queueName: 'videoAnalysisQueue',
    data: initialData,
    children: [
      {
        name: 'download-video',
        queueName: 'videoAnalysisQueue',
        data: initialData,
        children: [
          {
            name: 'extract-audio',
            queueName: 'videoAnalysisQueue',
            // ... ve böyle devam...
            data: {},
            children: [
              {
                name: 'transcribe-audio',
                queueName: 'videoAnalysisQueue',
                data: {},
                children: [
                  {
                    name: 'normalize-input',
                    queueName: 'videoAnalysisQueue',
                    data: {},
                    children: [
                      {
                        name: 'ai-analysis',
                        queueName: 'videoAnalysisQueue',
                        data: {},
                        children: [
                          {
                            name: 'score-calc',
                            queueName: 'videoAnalysisQueue',
                            data: {},
                            children: [
                              {
                                name: 'result-save',
                                queueName: 'videoAnalysisQueue',
                                data: {},
                                children: [
                                  {
                                    name: 'cleanup',
                                    queueName: 'videoAnalysisQueue',
                                    data: {}
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  });
}
