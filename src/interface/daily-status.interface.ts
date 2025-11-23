import { Document, Types } from 'mongoose';

export interface DriverDailyStatsInterface extends Document {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  date: Date;
  onlineMinutes?: number;
  completedRides?: number;
  cancelledRides?: number;
  earningsInPaise?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
