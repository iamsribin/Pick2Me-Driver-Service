import { DriverModel } from '@/model/driver.model';
import { DriverEventProducer } from '@/events/publisher';
import { v4 as uuidv4 } from 'uuid';

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
          receiverId: driver._id.toString(),
          documents: notifications,
          generatedAt: new Date(),
        };

        await DriverEventProducer.publishDocumentExpireNotification(msg);

        const setObj: any = { lastExpiryNotificationAt: new Date() };
        notifications.forEach((n) => {
          setObj[`lastExpiryNotifiedFor.${n.documentType}`] = new Date();
        });

        // await DriverModel.updateOne({ _id: driver._id }, { $set: setObj }).exec();
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



// notificationPayload {
//   messageId: 'f6ac9a9a-2c08-4efc-9bac-0e00cad02a7e',
//   receiverId: '68933743b49a8cf584ff3ef5',
//   documents: [
//     {
//       documentType: 'license',
//       expiryDate: 2025-09-07T00:00:00.000Z,
//       daysLeft: -72
//     },
//     {
//       documentType: 'rc',
//       expiryDate: 2025-09-07T00:00:00.000Z,
//       daysLeft: -72
//     },
//     {
//       documentType: 'insurance',
//       expiryDate: 2025-09-07T00:00:00.000Z,
//       daysLeft: -72
//     },
//     {
//       documentType: 'pollution',
//       expiryDate: 2025-09-06T00:00:00.000Z,
//       daysLeft: -73
//     }
//   ],
//   generatedAt: '2025-11-18T07:51:24.758Z'
// }