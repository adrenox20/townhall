import type { Env } from '../env';
export async function notificationConsumer(batch: MessageBatch, env: Env) {
  for (const message of batch.messages) {
    console.log('notification', message.body, env.FRONTEND_URL);
    message.ack();
  }
}
