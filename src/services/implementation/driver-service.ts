import { IDriverRepository } from '@/repositories/interfaces/i-driver-repository';
import { IDriverService } from '../interfaces/i-driver-service';
import { DriverDocumentDTO, DriverProfileDTO } from '@/dto/driver.dto';
import { PaymentResponse } from '@/types/driver-type/response-type';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { AccountStatus, DriverInterface } from '@/interface/driver.interface';
import { HttpError, InternalError, NotFoundError } from '@Pick2Me/shared/errors';
import { IResponse, StatusCode } from '@Pick2Me/shared/interfaces';
import { getRedisService } from '@Pick2Me/shared/redis';
import {
  UpdateDriverDocumentsReq,
  UpdateDriverProfileReq,
  handleOnlineChangeReq,
  increaseCancelCountReq,
  AddEarningsRequest,
} from '@/types';

@injectable()
export class DriverService implements IDriverService {
  constructor(@inject(TYPES.DriverRepository) private _driverRepo: IDriverRepository) {}

  async fetchDriverProfile(id: string): Promise<IResponse<DriverProfileDTO>> {
    const response = await this._driverRepo.findById(id);

    if (!response) throw NotFoundError('Driver not found');

    const driver: DriverProfileDTO = {
      name: response.name,
      email: response.email,
      mobile: response.mobile.toString(),
      driverImage: response.driverImage,
      address: response.location?.address,
      totalRatings: response.totalRatings || 0,
      joiningDate: response.joiningDate.toISOString().split('T')[0],
      completedRides: response.totalCompletedRides || 0,
      cancelledRides: response.totalCancelledRides || 0,
      walletBalance: 0,
      adminCommission: response.adminCommission || 0,
    };
    return {
      status: StatusCode.OK,
      message: 'success',
      data: driver,
    };
  }

  async updateDriverProfile(data: UpdateDriverProfileReq): Promise<IResponse<null>> {
    try {
      const filter = { _id: data.driverId };

      const updateData: Partial<Pick<DriverInterface, 'name' | 'driverImage' | 'accountStatus'>> =
        {};

      if (data?.name) updateData.name = data.name;
      if (data?.imageUrl) updateData.driverImage = data.imageUrl;

      updateData.accountStatus = AccountStatus.Pending;

      const response = await this._driverRepo.updateOne(filter, updateData);

      if (!response) throw NotFoundError('Driver not found');

      const redisService = getRedisService();
      await redisService.addBlacklistedToken(data.driverId, 604800); // Blacklist for verification

      return { status: StatusCode.OK, message: 'Success' };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('', {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async fetchDriverDocuments(id: string): Promise<IResponse<DriverDocumentDTO>> {
    try {
      const document = await this._driverRepo.getDocuments(id);

      if (!document) {
        return NotFoundError('Driver documents not found');
      }

      const driverDocumentDto: DriverDocumentDTO = {
        _id: id,
        aadhar: document.aadhar,
        license: document.license,
        vehicleRC: {
          registrationId: document.vehicleDetails.registrationId,
          rcFrontImageUrl: document.vehicleDetails.rcFrontImageUrl,
          rcBackImageUrl: document.vehicleDetails.rcBackImageUrl,
          rcStartDate: document.vehicleDetails.rcStartDate,
          rcExpiryDate: document.vehicleDetails.rcExpiryDate,
        },
        vehicleDetails: {
          vehicleNumber: document.vehicleDetails.vehicleNumber,
          vehicleColor: document.vehicleDetails.vehicleColor,
          model: document.vehicleDetails.model,
          carFrontImageUrl: document.vehicleDetails.carFrontImageUrl,
          carBackImageUrl: document.vehicleDetails.carBackImageUrl,
        },
        insurance: {
          insuranceImageUrl: document.vehicleDetails.insuranceImageUrl,
          insuranceStartDate: document.vehicleDetails.insuranceStartDate,
          insuranceExpiryDate: document.vehicleDetails.insuranceExpiryDate,
        },
        pollution: {
          pollutionImageUrl: document.vehicleDetails.pollutionImageUrl,
          pollutionStartDate: document.vehicleDetails.pollutionStartDate,
          pollutionExpiryDate: document.vehicleDetails.pollutionExpiryDate,
        },
      };

      return {
        status: StatusCode.OK,
        message: 'Driver documents fetched successfully',
        data: driverDocumentDto,
      };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('', {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async updateDriverDocuments(data: UpdateDriverDocumentsReq): Promise<IResponse<null>> {
    try {
      const { driverId, section, updates } = data;

      const updateQuery: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(updates)) {
        updateQuery[`${section}.${key}`] = value;
      }

      updateQuery.accountStatus = 'Pending';

      const response = await this._driverRepo.updateOne({ _id: driverId }, { $set: updateQuery });

      if (!response) throw NotFoundError('Driver not found');

      const redisService = getRedisService();
      await redisService.addBlacklistedToken(driverId, 604800); // Blacklisted for verification
      console.log('token black listed');

      return { status: StatusCode.OK, message: 'Success' };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('', {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async handleOnlineChange(data: handleOnlineChangeReq): Promise<IResponse<null>> {
    try {
      console.log('handleOnlineChange data:', data);

      const driver = await this._driverRepo.findById(data.driverId);
      if (!driver) {
        throw NotFoundError('Driver not found');
      }

      const redisService = getRedisService();

      // If going offline → calculate hours
      if (!data.online && data.onlineTimestamp) {
        const onlineDurationMs = Date.now() - new Date(data.onlineTimestamp).getTime();
        const hours = Math.round((onlineDurationMs / (1000 * 60 * 60)) * 100) / 100;
        await this._driverRepo.updateOnlineHours(data.driverId, hours);

        redisService.removeOnlineDriver(data.driverId);
      }

      // If going online → add/update Redis
      if (data.online) {
        const driverDetails = {
          driverId: data.driverId,
          driverNumber: driver.mobile.toString(),
          name: driver.name,
          cancelledRides: driver.totalCancelledRides || 0,
          rating: driver.totalRatings || 0,
          vehicleModel: driver.vehicleDetails.model,
          driverPhoto: driver.driverImage,
          vehicleNumber: driver.vehicleDetails.vehicleNumber,
          stripeId: driver.accountId,
          stripeLinkUrl: driver.accountLinkUrl,
        };

        await redisService.addDriverGeo(data.driverId, data.location.lng, data.location.lat);
        await redisService.setHeartbeat(data.driverId);
        // await redisService.isDriverOnline(driverDetails);
      }
      await this._driverRepo.updateOne(
        { _id: data.driverId },
        { $set: { onlineStatus: data.online } }
      );

      return { status: StatusCode.OK, message: 'Driver status updated' };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('', {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async addEarnings(earnings: AddEarningsRequest): Promise<PaymentResponse> {
    try {
      const res = await this._driverRepo.addEarnings(earnings);

      if (!res)
        return {
          status: 'failed',
          message: 'driver not found',
        };

      return {
        status: 'success',
        message: 'Earnings added successfully',
      };
    } catch (error) {
      console.error('Error in addEarnings:', error);
      return {
        status: 'failed',
        message: (error as Error).message,
      };
    }
  }

  async getDriverStripe(driverId: string): Promise<{ status: string; stripeId: string }> {
    const driverData = await this._driverRepo.findById(driverId);
    if (!driverData) throw new Error('no driver found');

    return { status: 'success', stripeId: driverData.accountId };
  }

  async increaseCancelCount(payload: increaseCancelCountReq): Promise<void> {
    try {
      console.log('payload', payload);

      await this._driverRepo.increaseCancelCount(payload.driverId);
      console.log(`✅ Cancel count increased for driver ${payload.driverId}`);
    } catch (error) {
      console.log('❌ error in increaseCancelCount', error);
      throw error;
    }
  }
}
