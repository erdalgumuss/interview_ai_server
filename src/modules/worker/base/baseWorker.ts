// src/modules/worker/base/BaseWorker.ts

import { Worker, Job } from 'bullmq';
import { redisConfig } from '../../../config/redis.ts';
import { connectMongoDB } from '../../../config/db.ts';

export abstract class BaseWorker {
  private queueName: string;

  constructor(queueName: string) {
    this.queueName = queueName;
    this.initialize();
  }

  private async initialize() {
    await connectMongoDB();
    const worker = new Worker(
      this.queueName,
      async (job: Job) => this.handleJob(job),
      { connection: redisConfig }
    );

    process.on('SIGINT', async () => {
      await worker.close();
      process.exit(0);
    });
  }

  protected abstract handleJob(job: Job): Promise<void>;
}
