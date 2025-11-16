import mongoose, { Schema } from 'mongoose';
import { AccountStatus, DriverInterface } from '../interface/driver.interface';

const DriverSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    mobile: {
      type: Number,
      required: true,
      unique: true,
      trim: true,
    },
    password: { type: String, required: true },
    driverImage: { type: String },
    referralCode: { type: String },
    joiningDate: { type: Date, default: Date.now },
    accountId: { type: String },
    accountLinkUrl: { type: String },

    aadhar: {
      id: { type: String },
      frontImageUrl: { type: String },
      backImageUrl: { type: String },
    },

    license: {
      id: { type: String },
      frontImageUrl: { type: String },
      backImageUrl: { type: String },
      validity: { type: Date },
    },

    location: {
      longitude: { type: String },
      latitude: { type: String },
      address: { type: String },
    },

    vehicleDetails: {
      registrationId: { type: String },
      rcFrontImageUrl: { type: String },
      rcBackImageUrl: { type: String },
      rcStartDate: { type: Date },
      rcExpiryDate: { type: Date },

      vehicleNumber: { type: String },
      vehicleColor: { type: String },
      model: { type: String },
      carFrontImageUrl: { type: String },
      carBackImageUrl: { type: String },

      insuranceImageUrl: { type: String },
      insuranceStartDate: { type: Date },
      insuranceExpiryDate: { type: Date },

      pollutionImageUrl: { type: String },
      pollutionStartDate: { type: Date },
      pollutionExpiryDate: { type: Date },
    },

    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.Incomplete,
    },

    onlineStatus: { type: Boolean },
    adminCommission: { type: Number, default: 0 },

    totalCompletedRides: { type: Number, default: 0 },
    totalCancelledRides: { type: Number, default: 0 },

    isAvailable: { type: Boolean, default: true },
    totalRatings: { type: Number, default: 0 },

    ratingSum: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DriverSchema.index({ location: '2dsphere' });

export const DriverModel = mongoose.model<DriverInterface>('Driver', DriverSchema);
