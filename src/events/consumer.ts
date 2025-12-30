import { container } from '@/config/inversify.config';
import { IDriverService } from '@/services/interfaces/i-driver-service';
import { TYPES } from '@/types/inversify-types';
import { EXCHANGES, QUEUES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';
const driverService = container.get<IDriverService>(TYPES.DriverService);
export class EventConsumer {
  static async init() {
    await RabbitMQ.connect({
      url: process.env.RABBIT_URL!,
      serviceName: 'driver-service',
    });

    await RabbitMQ.setupExchange(EXCHANGES.NOTIFICATION, 'topic');
    await RabbitMQ.setupExchange(EXCHANGES.PAYMENT, 'topic');

    await RabbitMQ.bindQueueToExchanges(QUEUES.DRIVER_QUEUE, [
      {
        exchange: EXCHANGES.NOTIFICATION,
        routingKeys: ['realtime-driver.#'],
      },
      {
        exchange: EXCHANGES.PAYMENT,
        routingKeys: ['payment-driver.#'],
      },
    ]);

    await RabbitMQ.consume(QUEUES.DRIVER_QUEUE, async (msg) => {
      switch (msg.type) {
        case ROUTING_KEYS.UPDATE_DRIVER_RIDE_COUNT:
          console.log('INCREASE_DRIVER_RIDE_COUNT:', msg.data);
          driverService.updateRideCount(msg.data);
          break;
        case ROUTING_KEYS.UPDATE_DRIVER_EARNINGS:
          console.log('UPDATE_DRIVER_EARNINGS:', msg.data);
          break;
        default:
          console.warn('Unknown message:', msg);
      }
    });
  }
}

// INCREASE_DRIVER_RIDE_COUNT: { driverId: '68933743b49a8cf584ff3ef5', status: 'ACCEPT' }
