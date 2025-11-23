import { DriverDailyStatsInterface } from '@/interface/daily-status.interface';
import { DriverDailyStats } from '@/model/daily-status.model';
import { MongoBaseRepository } from '@Pick2Me/shared/mongo';
import { injectable } from 'inversify';
import mongoose from 'mongoose';
import { IDailyStatusRepository } from '../interfaces/i-daily-satus-repository';

@injectable()
export class DailyStatusRepository
  extends MongoBaseRepository<DriverDailyStatsInterface>
  implements IDailyStatusRepository
{
  constructor() {
    super(DriverDailyStats);
  }

  async addSessionMinutesToDailyStats(driverId: string, startMs: number, endMs: number) {
    const msToMinutes = (ms: number) => Math.max(0, Math.round(ms / 60000));
    const start = new Date(startMs);
    const end = new Date(endMs);

    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);

    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    if (startDay.getTime() === endDay.getTime()) {
      const minutes = msToMinutes(endMs - startMs);
      await this.findOneAndUpdateUpsert(
        { driverId: new mongoose.Types.ObjectId(driverId), date: startDay },
        { $inc: { onlineMinutes: minutes } }
      );
      return;
    }

    const midnight = new Date(startDay);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);

    const firstPartMs = midnight.getTime() - startMs;
    const firstMinutes = msToMinutes(firstPartMs);
    await this.findOneAndUpdateUpsert(
      { driverId: new mongoose.Types.ObjectId(driverId), date: startDay },
      { $inc: { onlineMinutes: firstMinutes } }
    );

    const restMinutes = msToMinutes(endMs - midnight.getTime());
    await this.findOneAndUpdateUpsert(
      { driverId: new mongoose.Types.ObjectId(driverId), date: endDay },
      { $inc: { onlineMinutes: restMinutes } }
    );
  }
}
