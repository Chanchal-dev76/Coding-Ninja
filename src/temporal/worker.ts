import { Worker } from '@temporalio/worker';
import { config } from '../config/env';
import { activities } from './activities';
import { logger } from '../logger';

export async function createTemporalWorker(): Promise<Worker> {
  logger.info(
    { address: config.temporalAddress, taskQueue: config.temporalTaskQueue },
    'Creating Temporal Worker...'
  );

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: config.temporalTaskQueue,
  });

  return worker;
}

export async function runWorker(): Promise<void> {
  try {
    const worker = await createTemporalWorker();
    logger.info('Temporal Worker started listening on task queue');
    await worker.run();
  } catch (err: any) {
    logger.error({ err: err.message }, 'Temporal Worker failed to run');
    throw err;
  }
}

if (require.main === module) {
  runWorker().catch((err) => {
    logger.error({ err }, 'Worker fatal exit');
    process.exit(1);
  });
}
