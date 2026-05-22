export async function analyticsConsumer(batch: MessageBatch) {
  for (const message of batch.messages) message.ack();
}
