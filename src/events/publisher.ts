import { UserRegisteredEvent } from '@Pick2Me/shared/interfaces';
import { EXCHANGES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';

const url = process.env.RABBIT_URL!;

export class DriverEventProducer {
  static async publishNotificationEvent(notificationData: any) {
    await RabbitMQ.connect({ url, serviceName: 'driver-service' });
    await RabbitMQ.setupExchange(EXCHANGES.DRIVER, 'topic');

    const notificationPayload = {
      id: notificationData.id,
      data: 'document expires',
      type: ROUTING_KEYS.DRIVER_LOCATION_UPDATE,
    };

    await RabbitMQ.publish(
      EXCHANGES.DRIVER,
      ROUTING_KEYS.DRIVER_LOCATION_UPDATE,
      notificationPayload
    );
    console.log(`[Driver ser] 📤 Published notificatio → ${notificationData.id}`);
  }
}
