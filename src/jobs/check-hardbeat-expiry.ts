import { container } from '@/config/inversify.config';
import { IDriverService } from '@/services/interfaces/i-driver-service';
import { TYPES } from '@/types/inversify-types';
import { HEARTBEAT_PREFIX } from '@Pick2Me/shared/constants';
import { getRedisService } from '@Pick2Me/shared/redis';

const driverService = container.get<IDriverService>(TYPES.DriverService);

export async function listenForExpiredKeys() {
  const redisService = getRedisService();
  const redis = redisService.raw();
  console.log('callle');

  const subscriber = redis.duplicate();

  await subscriber.subscribe('__keyevent@0__:expired');

  subscriber.on('message', async (_, key) => {
    console.log('message on expire key', key);

    const baseKey = key.substring(0, key.lastIndexOf(':') + 1);
    console.log('key', baseKey);

    if (baseKey === HEARTBEAT_PREFIX) {
      const userId = key.split(':')[2];
      const driver = await redisService.getOnlineDriverDetails(userId);
      console.log(`Redis TTL expired → user ${userId} marked offline`);

      if (driver) {
        // driverService.toggleOnline(userId, false);
      }
    }
  });
}
