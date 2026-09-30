import { Connection, Client } from '@temporalio/client';
import { config } from '../config/env';
import { hotelOrchestratorWorkflow } from './workflows';
import { DeduplicatedHotel } from '../types/hotel';
import { logger } from '../logger';

export class TemporalClientManager {
  private client: Client | null = null;
  private connection: Connection | null = null;
  private isConnecting = false;

  public async getClient(): Promise<Client> {
    if (config.nodeEnv === 'test') {
      throw new Error('Temporal is disabled in test environment');
    }

    if (this.client) {
      return this.client;
    }

    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (this.client) return this.client;
    }

    this.isConnecting = true;
    try {
      const connectPromise = Connection.connect({
        address: config.temporalAddress,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Temporal connection timed out')), 2000)
      );

      this.connection = await Promise.race([connectPromise, timeoutPromise]);

      this.client = new Client({
        connection: this.connection,
        namespace: config.temporalNamespace,
      });

      logger.info(
        { address: config.temporalAddress, namespace: config.temporalNamespace },
        'Connected to Temporal Server'
      );
      return this.client;
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Failed to connect to Temporal Server');
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  public async executeHotelWorkflow(city: string): Promise<DeduplicatedHotel[]> {
    const client = await this.getClient();
    const workflowId = `hotel-orchestrator-${city.toLowerCase().trim()}-${Date.now()}`;

    logger.info(
      { workflowId, city, taskQueue: config.temporalTaskQueue },
      'Executing hotelOrchestratorWorkflow on Temporal'
    );

    const handle = await client.workflow.start(hotelOrchestratorWorkflow, {
      taskQueue: config.temporalTaskQueue,
      workflowId,
      args: [city],
    });

    const result = await handle.result();
    logger.info({ workflowId, city, hotelCount: result.length }, 'Workflow completed successfully');
    return result;
  }

  public async checkHealth(): Promise<{ status: 'UP' | 'DOWN'; latencyMs?: number; message?: string }> {
    const start = Date.now();
    try {
      const client = await this.getClient();
      // Describe namespace to verify connection & server responsiveness
      await client.workflowService.describeNamespace({
        namespace: config.temporalNamespace,
      });
      const latencyMs = Date.now() - start;
      return { status: 'UP', latencyMs };
    } catch (err: any) {
      return { status: 'DOWN', message: err.message || 'Temporal unreachable' };
    }
  }
}

export const temporalClientManager = new TemporalClientManager();
