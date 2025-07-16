// src/modules/worker/base/BaseWorker.ts

import { Worker, Job } from 'bullmq';
import { redisConfig } from '../../../config/redis.ts';
import { connectMongoDB } from '../../../config/db.ts';

export abstract class BaseWorker {
  private queueName: string;
  private concurrency: number;

  constructor(queueName: string, options?: { concurrency?: number }) {
    this.queueName = queueName;
    this.concurrency = options?.concurrency ?? 1; // default: 1
    this.initialize();
  }

  private async initialize() {
    await connectMongoDB();
    const worker = new Worker(
      this.queueName,
      async (job: Job) => this.handleJob(job),
      {
        connection: redisConfig,
        concurrency: this.concurrency,   // 👈
      }
    );

    process.on('SIGINT', async () => {
      await worker.close();
      process.exit(0);
    });
  }

  protected abstract handleJob(job: Job): Promise<void>;
}
