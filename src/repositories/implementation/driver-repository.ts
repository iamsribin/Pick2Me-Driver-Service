import { FilterQuery, UpdateQuery } from 'mongoose';
import { injectable } from 'inversify';
import { DriverInterface } from '@/interface/driver.interface';
import { DriverModel } from '@/model/driver.model';
import { IDriverRepository } from '../interfaces/i-driver-repository';
import { MongoBaseRepository } from '@pick2me/shared/mongo';
import {
  IdentificationUpdateQuery,
  InsuranceUpdateQuery,
  LocationUpdateReq,
  VehicleUpdateQuery,
} from '@/types';

@injectable()
export class DriverRepository
  extends MongoBaseRepository<DriverInterface>
  implements IDriverRepository
{
  constructor() {
    super(DriverModel);
  }

  async getByEmail(email: string): Promise<DriverInterface | null> {
    try {
      return this.findOne({ email });
    } catch {
      return null;
    }
  }

  async getByMobile(mobile: number): Promise<DriverInterface | null> {
    try {
      return this.findOne({ mobile });
    } catch {
      return null;
    }
  }

  async getActiveById(id: string): Promise<DriverInterface | null> {
    try {
      return this.findOne({ _id: id, isAvailable: true });
    } catch {
      return null;
    }
  }

  async updateProfileById(
    id: string,
    updateData: UpdateQuery<DriverInterface>
  ): Promise<DriverInterface | null> {
    try {
      return this.update(id, updateData);
    } catch {
      return null;
    }
  }

  async updateOneDriver(
    filter: FilterQuery<DriverInterface>,
    updateData: UpdateQuery<DriverInterface>
  ): Promise<DriverInterface | null> {
    try {
      return this.updateOne(filter, updateData);
    } catch {
      return null;
    }
  }

  async deleteDriverById(id: string): Promise<boolean | null> {
    try {
      return this.delete(id);
    } catch {
      return null;
    }
  }

  async getDrivers(filter: FilterQuery<DriverInterface> = {}): Promise<DriverInterface[] | null> {
    try {
      return this.find(filter);
    } catch {
      return null;
    }
  }

  async getByIdWithProjection(id: string, projection: string): Promise<DriverInterface | null> {
    try {
      return this.findById(id, projection);
    } catch {
      return null;
    }
  }

  async exists(filter: FilterQuery<DriverInterface>): Promise<boolean | null> {
    try {
      const driver = await this.findOne(filter);
      return !!driver;
    } catch {
      return null;
    }
  }

  async updateIdentification(data: IdentificationUpdateQuery): Promise<DriverInterface | null> {
    try {
      return this.update(data.driverId, {
        $set: {
          aadhar: {
            id: data.aadharID,
            frontImageUrl: data.aadharFrontImage,
            backImageUrl: data.aadharBackImage,
          },
          license: {
            id: data.licenseID,
            frontImageUrl: data.licenseFrontImage,
            backImageUrl: data.licenseBackImage,
            validity: data.licenseValidity,
          },
        },
      });
    } catch {
      return null;
    }
  }

  async updateDriverImage(data: {
    driverId: string;
    imageUrl: string;
  }): Promise<DriverInterface | null> {
    try {
      return this.update(data.driverId, {
        $set: {
          driverImage: data.imageUrl,
        },
      });
    } catch {
      return null;
    }
  }

  async vehicleUpdate(data: VehicleUpdateQuery): Promise<DriverInterface | null> {
    try {
      return this.update(data.driverId, {
        $set: {
          'vehicleDetails.registrationId': data.registrationId,
          'vehicleDetails.model': data.model,
          'vehicleDetails.vehicleColor': data.vehicleColor,
          'vehicleDetails.vehicleNumber': data.vehicleNumber,
          'vehicleDetails.rcFrontImageUrl': data.carFrondImageUrl,
          'vehicleDetails.rcBackImageUrl': data.rcBackImageUrl,
          'vehicleDetails.carFrontImageUrl': data.carFrondImageUrl,
          'vehicleDetails.carBackImageUrl': data.carBackImageUrl,
          'vehicleDetails.rcStartDate': data.rcStartDate,
          'vehicleDetails.rcExpiryDate': data.rcExpiryDate,
        },
      });
    } catch {
      return null;
    }
  }

  async locationUpdate(data: LocationUpdateReq): Promise<DriverInterface | null> {
    try {
      return this.update(data.driverId, {
        $set: {
          'location.latitude': data.latitude,
          'location.longitude': data.longitude,
          'location.address': data.address,
          accountStatus: 'Pending',
        },
      });
    } catch {
      return null;
    }
  }

  async vehicleInsurancePollutionUpdate(
    data: InsuranceUpdateQuery
  ): Promise<DriverInterface | null> {
    try {
      return this.update(data.driverId, {
        $set: {
          'vehicleDetails.insuranceImageUrl': data.insuranceImageUrl,
          'vehicleDetails.insuranceStartDate': data.insuranceStartDate,
          'vehicleDetails.insuranceExpiryDate': data.insuranceExpiryDate,
          'vehicleDetails.pollutionImageUrl': data.pollutionImageUrl,
          'vehicleDetails.pollutionStartDate': data.pollutionStartDate,
          'vehicleDetails.pollutionExpiryDate': data.pollutionExpiryDate,
        },
      });
    } catch {
      return null;
    }
  }

  async getDocuments(id: string): Promise<DriverInterface | null> {
    try {
      return this.findById(id, 'aadhar license vehicleDetails');
    } catch {
      return null;
    }
  }

  // async updateOnlineHours(driverId: string, hoursToAdd: number): Promise<void | null> {
  //   try {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);

  //     const driver = await DriverModel.findOne({
  //       _id: driverId,
  //       'rideDetails.date': { $gte: today },
  //     });

  //     if (driver) {
  //       await DriverModel.updateOne(
  //         { _id: driverId, 'rideDetails.date': { $gte: today } },
  //         { $inc: { 'rideDetails.$.hour': hoursToAdd } }
  //       );
  //     } else {
  //       await DriverModel.updateOne(
  //         { _id: driverId },
  //         {
  //           $push: {
  //             rideDetails: {
  //               completedRides: 0,
  //               cancelledRides: 0,
  //               Earnings: 0,
  //               hour: hoursToAdd,
  //               date: new Date(),
  //             },
  //           },
  //         }
  //       );
  //     }
  //   } catch {
  //     return null;
  //   }
  // }

  // async increaseCancelCount(driverId: string): Promise<void | null> {
  //   try {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0); // normalize to midnight

  //     const driver = await DriverModel.findOne({
  //       _id: driverId,
  //       'rideDetails.date': { $gte: today },
  //     });

  //     if (driver) {
  //       await DriverModel.updateOne(
  //         { _id: driverId, 'rideDetails.date': { $gte: today } },
  //         {
  //           $inc: {
  //             totalCancelledRides: 1,
  //             'rideDetails.$.cancelledRides': 1,
  //           },
  //         }
  //       );
  //     } else {
  //       await DriverModel.updateOne(
  //         { _id: driverId },
  //         {
  //           $inc: { totalCancelledRides: 1 },
  //           $push: {
  //             rideDetails: {
  //               completedRides: 0,
  //               cancelledRides: 1,
  //               Earnings: 0,
  //               hour: 0,
  //               date: new Date(),
  //             },
  //           },
  //         }
  //       );
  //     }
  //   } catch {
  //     return null;
  //   }
  // }

  // async addEarnings(data: AddEarningsRequest) {
  //   try {
  //     const { driverId, platformFee, driverShare } = data;

  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);
  //     const endOfDay = new Date();
  //     endOfDay.setHours(23, 59, 59, 999);

  //     const updated = await DriverModel.findOneAndUpdate(
  //       {
  //         _id: driverId,
  //         'rideDetails.date': { $gte: today, $lte: endOfDay },
  //       },
  //       {
  //         $inc: {
  //           'rideDetails.$.Earnings': Number(driverShare),
  //           adminCommission: Number(adminShare),
  //         },
  //       },
  //       { new: true }
  //     ).exec();

  //     if (updated) return updated;

  //     const pushed = await DriverModel.findOneAndUpdate(
  //       { _id: driverId },
  //       {
  //         $inc: { adminCommission: Number(adminShare) },
  //         $push: {
  //           rideDetails: {
  //             Earnings: Number(driverShare),
  //             date: new Date(),
  //             completedRides: 0,
  //             cancelledRides: 0,
  //             hour: 0,
  //           },
  //         },
  //       },
  //       { new: true }
  //     ).exec();

  //     if (!pushed) throw NotFoundError('Driver not found');

  //     return pushed;
  //   } catch {
  //     return null;
  //   }
  // }

  async checkDocumentExpiry(
    driverId: string,
    expiringDays = 7
  ): Promise<{
    driverId: string;
    expiredDocuments: string[];
    expiringSoonDocuments: string[];
    checkedAt: string;
  } | null> {
    try {
      const driver = await DriverModel.findById(driverId, {
        license: 1,
        vehicleDetails: 1,
        lastExpiryNotificationAt: 1,
        lastExpiryNotificationFor: 1,
        name: 1,
      });

      if (!driver) return null;

      const now = new Date();
      const future = new Date(now);
      future.setDate(future.getDate() + expiringDays);

      const toDate = (d: Date | string | null | undefined): Date | null => {
        if (!d) return null;
        if (d instanceof Date) return d;

        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const checks: Array<{ key: string; date: Date | null }> = [
        { key: 'license', date: toDate(driver.license?.validity) },
        { key: 'rc', date: toDate(driver.vehicleDetails?.rcExpiryDate) },
        { key: 'insurance', date: toDate(driver.vehicleDetails?.insuranceExpiryDate) },
        { key: 'pollution', date: toDate(driver.vehicleDetails?.pollutionExpiryDate) },
      ];

      const expiredDocuments: string[] = [];
      const expiringSoonDocuments: string[] = [];

      for (const c of checks) {
        const date = c.date;
        if (!date) continue;
        if (date.getTime() < now.getTime()) {
          expiredDocuments.push(c.key);
        } else if (date.getTime() <= future.getTime()) {
          expiringSoonDocuments.push(c.key);
        }
      }

      return {
        driverId: driver._id.toString(),
        expiredDocuments,
        expiringSoonDocuments,
        checkedAt: now.toISOString(),
      };
    } catch (err) {
      console.error('Error in checkDocumentExpiry:', err);
      return null;
    }
  }
}
