import { EXCHANGES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';

const url = process.env.RABBIT_URL!;

export class DriverEventProducer {
  static async publishDocumentExpireNotification(notificationData: any) {
    await RabbitMQ.connect({ url, serviceName: 'driver-service' });
    await RabbitMQ.setupExchange(EXCHANGES.DRIVER, 'topic');

    const notificationPayload = {
      receiverId: notificationData.id,
      title: 'document expires',
      body: 'your ${documents} expires update that before going to online',
      data: new Date(),
      type: ROUTING_KEYS.NOTIFY_DOCUMENT_EXPIRE,
    };

    await RabbitMQ.publish(
      EXCHANGES.DRIVER,
      ROUTING_KEYS.NOTIFY_DOCUMENT_EXPIRE,
      notificationPayload
    );
    console.log(`[Driver ser] 📤 Published notificatio → ${notificationData.id}`);
  }
}
