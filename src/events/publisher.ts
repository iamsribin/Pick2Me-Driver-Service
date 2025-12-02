import { EXCHANGES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';

const url = process.env.RABBIT_URL!;

interface documentData {
  messageId: string;
  receiverId: string;
  documents: any;
  generatedAt: Date;
}

export class DriverEventProducer {
  static async publishDocumentExpireNotification(documentData: documentData) {
    await RabbitMQ.connect({ url, serviceName: 'driver-service' });
    await RabbitMQ.setupExchange(EXCHANGES.DRIVER, 'topic');

    const notificationPayload = {
      data: documentData,
      type: ROUTING_KEYS.NOTIFY_DOCUMENT_EXPIRE,
    };

    await RabbitMQ.publish(
      EXCHANGES.DRIVER,
      ROUTING_KEYS.NOTIFY_DOCUMENT_EXPIRE,
      notificationPayload
    );
    console.log(`[Driver ser] 📤 Published notification → ${notificationPayload}`);
  }
}
