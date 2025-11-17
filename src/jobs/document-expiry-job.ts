import { DriverModel } from '@/model/driver.model';
import { DriverEventProducer } from '@/events/publisher';
import { v4 as uuidv4 } from 'uuid';

const ROUTING_KEY = 'driver.document.expiry';

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function runDocumentExpiryCheck(thresholdDays = 7, minNotificationIntervalDays = 7) {
  try {
    const thresholdDate = daysFromNow(thresholdDays);

    const orClauses: any[] = [
      { 'license.validity': { $exists: true, $lte: thresholdDate } },
      { 'vehicleDetails.rcExpiryDate': { $exists: true, $lte: thresholdDate } },
      { 'vehicleDetails.insuranceExpiryDate': { $exists: true, $lte: thresholdDate } },
      { 'vehicleDetails.pollutionExpiryDate': { $exists: true, $lte: thresholdDate } },
    ];

    const minNotifiedBefore = daysFromNow(-minNotificationIntervalDays);
    const query = {
      $and: [
        { $or: orClauses },
        {
          $or: [
            { lastExpiryNotificationAt: { $exists: false } },
            { lastExpiryNotificationAt: { $lte: minNotifiedBefore } },
          ],
        },
      ],
    };

    const cursor = DriverModel.find(query).cursor();

    let count = 0;
    for await (const driver of cursor) {
      try {
        const notifications: any[] = [];

        const fieldsToCheck = [
          { name: 'license', path: 'license.validity' },
          { name: 'rc', path: 'vehicleDetails.rcExpiryDate' },
          { name: 'insurance', path: 'vehicleDetails.insuranceExpiryDate' },
          { name: 'pollution', path: 'vehicleDetails.pollutionExpiryDate' },
        ];

        for (const f of fieldsToCheck) {
          const expiry = get(driver, f.path);
          if (expiry) {
            const daysLeft = Math.ceil((+new Date(expiry) - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= thresholdDays) {
              notifications.push({
                documentType: f.name,
                expiryDate: expiry,
                daysLeft,
              });
            }
          }
        }

        if (notifications.length === 0) continue;

        const msg = {
          messageId: uuidv4(),
          service: 'driver-service',
          receiverId: driver._id.toString(),
          documents: notifications,
          generatedAt: new Date().toISOString(),
          type: ROUTING_KEY,
        };

        await DriverEventProducer.publishDocumentExpireNotification(msg);

        const setObj: any = { lastExpiryNotificationAt: new Date() };
        notifications.forEach((n) => {
          setObj[`lastExpiryNotifiedFor.${n.documentType}`] = new Date();
        });

        await DriverModel.updateOne({ _id: driver._id }, { $set: setObj }).exec();
        count++;
      } catch (innerErr) {
        console.error('[expiry-job] failed to notify for driver', driver._id, innerErr);
      }
    }

    console.info(`[expiry-job] processed ${count} drivers`);
  } catch (err) {
    console.error('[expiry-job] error', err);
  }
}

function get(obj: any, path: string) {
  return path.split('.').reduce((acc: any, p: string) => (acc ? acc[p] : undefined), obj);
}
