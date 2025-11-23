import { DriverDailyStatsInterface } from '@/interface/daily-status.interface';
import { IMongoBaseRepository } from '@Pick2Me/shared/mongo';

export interface IDailyStatusRepository extends IMongoBaseRepository<DriverDailyStatsInterface> {
  addSessionMinutesToDailyStats(driverId: string, startMs: number, endMs: number): Promise<void>;
}
