import { DriverDailyStatsInterface } from '@/interface/daily-status.interface';
import { FilterType } from '@/types';
import { ActivityResponse } from '@/types/driver-type/response-type';
import { IMongoBaseRepository } from '@pick2me/shared/mongo';

export interface IDailyStatusRepository extends IMongoBaseRepository<DriverDailyStatsInterface> {
  addSessionMinutesToDailyStats(driverId: string, startMs: number, endMs: number): Promise<void>;
  incrementTodayRideCount(
    driverId: string,
    field: 'completedRides' | 'cancelledRides',
    increment?: number
  ): Promise<void>;
  getDriverStats(driverId: string, filter?: FilterType): Promise<Array<ActivityResponse>>;
}
