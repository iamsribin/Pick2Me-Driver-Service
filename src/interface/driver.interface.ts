export enum AccountStatus {
  Good = 'Good',
  Warning = 'Warning',
  Rejected = 'Rejected',
  Blocked = 'Blocked',
  Pending = 'Pending',
  Incomplete = 'Incomplete',
}

export interface DriverRideStats {
  _id: string;
  totalCompletedRides: number;
  totalCancelledRides: number;
  totalEarnings: number;
  totalWorkingHours: number;
  // rideDetails: DriverInterface['rideDetails'];
}

import { Document, Types } from 'mongoose';

// Main driver interface
export interface DriverInterface extends Document {
  _id: Types.ObjectId;

  name: string;
  email: string;
  mobile: string;
  password: string;

  driverImage: string;
  referralCode: string;
  joiningDate: Date;
  accountId: string;
  accountLinkUrl: string;

  aadhar: {
    id: string;
    frontImageUrl: string;
    backImageUrl: string;
  };

  license: {
    id: string;
    frontImageUrl: string;
    backImageUrl: string;
    validity: Date;
  };

  location: {
    longitude: string;
    latitude: string;
    address: string;
  };

  vehicleDetails: {
    registrationId: string;
    rcFrontImageUrl: string;
    rcBackImageUrl: string;
    rcStartDate: Date;
    rcExpiryDate: Date;

    vehicleNumber: string;
    vehicleColor: string;
    model: string;
    carFrontImageUrl: string;
    carBackImageUrl: string;

    insuranceImageUrl: string;
    insuranceStartDate: Date;
    insuranceExpiryDate: Date;

    pollutionImageUrl: string;
    pollutionStartDate: Date;
    pollutionExpiryDate: Date;
  };

  accountStatus: AccountStatus;
  onlineStatus?: boolean;
  adminCommission?: number;

  totalCompletedRides?: number;
  totalCancelledRides?: number;
  isAvailable?: boolean;

  totalRatings?: number;
  ratingSum?: number;

  lastExpiryNotificationAt?:Date,
  lastExpiryNotificationFor?: [string],

  createdAt?: Date;
  updatedAt?: Date;
}
