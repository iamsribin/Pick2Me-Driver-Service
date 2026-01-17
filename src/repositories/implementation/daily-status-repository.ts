import { DriverDailyStatsInterface } from '@/interface/daily-status.interface';
import { DriverDailyStats } from '@/model/daily-status.model';
import { MongoBaseRepository } from '@pick2me/shared/mongo';
import { injectable } from 'inversify';
import mongoose, { PipelineStage, UpdateQuery } from 'mongoose';
import { IDailyStatusRepository } from '../interfaces/i-daily-satus-repository';
import { FilterType } from '@/types';

@injectable()
export class DailyStatusRepository
  extends MongoBaseRepository<DriverDailyStatsInterface>
  implements IDailyStatusRepository {
  constructor() {
    super(DriverDailyStats);
  }

  private startDateForFilter(filter: FilterType) {
    const now = new Date();
    if (filter === "day") {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - 6); // last 7 days inclusive
      return d;
    }
    if (filter === "month") {
      const d = new Date(now);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      d.setMonth(d.getMonth() - 11); // last 12 months inclusive
      return d;
    }
    // year
    const d = new Date(now);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    d.setFullYear(d.getFullYear() - 2); // last 3 years inclusive
    return d;
  }

  private formatKeyForDate(date: Date, filter: FilterType) {
    const y = date.getFullYear();
    const m = ("0" + (date.getMonth() + 1)).slice(-2);
    const d = ("0" + date.getDate()).slice(-2);
    if (filter === "day") return `${y}-${m}-${d}`;     // 2026-01-16
    if (filter === "month") return `${y}-${m}`;       // 2026-01
    return `${y}`;                                    // 2026
  }

  private generatePeriodKeys(filter: FilterType) {
    const keys: string[] = [];
    const now = new Date();
    const start = this.startDateForFilter(filter);
    const tmp = new Date(start);

    if (filter === "day") {
      while (tmp <= now) {
        keys.push(this.formatKeyForDate(new Date(tmp), "day"));
        tmp.setDate(tmp.getDate() + 1);
      }
    } else if (filter === "month") {
      while (tmp <= now) {
        keys.push(this.formatKeyForDate(new Date(tmp), "month"));
        tmp.setMonth(tmp.getMonth() + 1);
      }
    } else {
      while (tmp.getFullYear() <= now.getFullYear()) {
        keys.push(this.formatKeyForDate(new Date(tmp), "year"));
        tmp.setFullYear(tmp.getFullYear() + 1);
      }
    }

    return keys;
  }

  // --- new public method ---
  async getDriverStats(driverId: string, filter: FilterType = "month") {
    const timezone = "Asia/Kolkata";
    // determine date format for $dateToString
    let dateFormat = "%Y-%m";
    if (filter === "day") dateFormat = "%Y-%m-%d";
    if (filter === "year") dateFormat = "%Y";

    const startDate = this.startDateForFilter(filter);

    const match: any = {
      driverId: new mongoose.Types.ObjectId(driverId),
      date: { $gte: startDate },
    };

    const aggPipeline:PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: "$date", timezone } },
          },
          onlineMinutes: { $sum: "$onlineMinutes" },
          completedRides: { $sum: "$completedRides" },
          cancelledRides: { $sum: "$cancelledRides" },
          totalPaise: { $sum: "$earningsInPaise" },
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id.period",
          onlineMinutes: 1,
          completedRides: 1,
          cancelledRides: 1,
          earningsInPaise: "$totalPaise",
        },
      },
      { $sort: { period: 1 } },
    ];

    const results = await DriverDailyStats.aggregate(aggPipeline).allowDiskUse(true).exec();

    // map results by period key for quick lookup
    const map = new Map<string, any>();
    for (const r of results) {
      // earnings: convert paise -> rupees with 2 decimals
      const rupees = r.earningsInPaise ? Number((r.earningsInPaise / 100).toFixed(2)) : 0;
      map.set(r.period, {
        onlineMinutes: r.onlineMinutes ?? 0,
        completedRides: r.completedRides ?? 0,
        cancelledRides: r.cancelledRides ?? 0,
        earnings: rupees,
      });
    }

    // fill missing periods and return canonical ISO date (period start)
    const keys = this.generatePeriodKeys(filter);
    const data = keys.map((key) => {
      const value = map.get(key) || { onlineMinutes: 0, completedRides: 0, cancelledRides: 0, earnings: 0 };

      let isoDate: string;
      if (filter === "day") isoDate = `${key}T00:00:00.000Z`;
      else if (filter === "month") isoDate = `${key}-01T00:00:00.000Z`;
      else isoDate = `${key}-01-01T00:00:00.000Z`;

      return {
        date: isoDate,
        onlineMinutes: value.onlineMinutes,
        completedRides: value.completedRides,
        cancelledRides: value.cancelledRides,
        earnings: value.earnings,
      };
    });

    return data;
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

  async incrementTodayRideCount(
    driverId: string,
    field: 'completedRides' | 'cancelledRides',
    increment = 1
  ): Promise<void> {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    // const date = startOfDay(new Date());
    const filter = { driverId: new mongoose.Types.ObjectId(driverId), date };
    const update: UpdateQuery<DriverDailyStatsInterface> = {
      $inc: { [field]: increment, totalRides: increment } as any,
      $setOnInsert: { driverId: new mongoose.Types.ObjectId(driverId), date } as any,
    };

    await this.findOneAndUpdateUpsert(filter, update, { upsert: true, new: true });
  }
}
