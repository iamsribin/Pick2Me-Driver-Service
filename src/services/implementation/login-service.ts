import mongoose, { UpdateQuery } from 'mongoose';
import { ILoginService } from '../interfaces/i-login-service';
import { ResubmissionInterface } from '@/interface/resubmission.interface';
import { IDriverRepository } from '@/repositories/interfaces/i-driver-repository';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { postResubmissionDocumentsReq } from '@/types';
import { AccountStatus, DriverInterface } from '@/interface/driver.interface';
import { HttpError, InternalError, NotFoundError } from '@Pick2Me/shared/errors';
import { commonRes, StatusCode } from '@Pick2Me/shared/interfaces';
import { AccessPayload, generateJwtToken } from '@Pick2Me/shared/auth';
import { IMongoBaseRepository } from '@Pick2Me/shared/mongo';
import {
  CheckLoginDriverRes,
  GetResubmissionDocumentsRes,
} from '@/types/auth-types/response-types';

@injectable()
export class LoginService implements ILoginService {
  constructor(
    @inject(TYPES.DriverRepository) private _driverRepo: IDriverRepository,
    @inject(TYPES.ResubmissionRepository)
    private _resubmissionRepo: IMongoBaseRepository<ResubmissionInterface>
  ) {}

  async loginCheckDriver(mobile: number): Promise<CheckLoginDriverRes> {
    try {
      console.log({ mobile: Number(mobile) });
      const response = await this._driverRepo.findOne({ mobile: Number(mobile) });
      console.log(response);

      if (!response) {
        throw NotFoundError('Account not found. Please create a new account.');
      }

      if (response.accountStatus === 'Good' || response.accountStatus === 'Warning') {
        const payload: AccessPayload = {
          id: response._id.toString(),
          role: 'Driver',
        };

        const refreshToken = generateJwtToken(
          payload,
          process.env.REFRESH_TOKEN_SECRET as string,
          '7d'
        );

        const accessToken = generateJwtToken(
          payload,
          process.env.ACCESS_TOKEN_SECRET as string,
          '3m'
        );

        return {
          status: StatusCode.OK,
          message: 'Success',
          name: response.name,
          refreshToken,
          token: accessToken,
          id: response._id.toString(),
        };
      } else if (response.accountStatus === 'Rejected') {
        return {
          status: StatusCode.OK,
          message: 'Rejected',
          id: response._id.toString(),
        };
      } else if (response.accountStatus === 'Blocked') {
        return { status: StatusCode.OK, message: 'Blocked' };
      } else if (response.accountStatus === 'Pending') {
        return {
          status: StatusCode.OK,
          message: 'Pending',
        };
      } else {
        return {
          status: StatusCode.OK,
          message: 'Incomplete',
        };
      }
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('Failed to check Google login', {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async checkGoogleLoginDriver(email: string): Promise<CheckLoginDriverRes> {
    const response = await this._driverRepo.findOne({ email });

    if (!response) {
      throw NotFoundError('Account not found. Please create a new account.');
    }

    if (response.accountStatus === 'Good' || response.accountStatus === 'Warning') {
      const payload: AccessPayload = {
        id: response._id.toString(),
        role: 'Driver',
      };

      const refreshToken = generateJwtToken(
        payload,
        process.env.REFRESH_TOKEN_SECRET as string,
        '7d'
      );
      const accessToken = generateJwtToken(
        payload,
        process.env.ACCESS_TOKEN_SECRET as string,
        '3m'
      );

      return {
        status: StatusCode.OK,
        message: 'Success',
        name: response.name,
        refreshToken,
        token: accessToken,
        id: response._id.toString(),
      };
    } else if (response.accountStatus === 'Rejected') {
      return {
        status: StatusCode.OK,
        message: 'Rejected',
        id: response._id.toString(),
      };
    } else if (response.accountStatus === 'Blocked') {
      return { status: StatusCode.OK, message: 'Blocked' };
    } else if (response.accountStatus === 'Pending') {
      return {
        status: StatusCode.OK,
        message: 'Pending',
      };
    } else {
      return {
        status: StatusCode.OK,
        message: 'Incomplete',
      };
    }
  }

  async getResubmissionDocuments(id: string): Promise<GetResubmissionDocumentsRes> {
    try {
      console.log('getResubmissionDocuments', id);

      const response = await this._resubmissionRepo.findOne({
        driverId: id,
      });

      if (!response)
        return {
          status: StatusCode.NotFound,
          message: 'No document found',
          navigate: '/driver/login',
        };

      const result = {
        status: StatusCode.OK,
        message: 'Success',
        data: response,
      };

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Service Error:', message);
      return {
        status: StatusCode.InternalServerError,
        message,
        navigate: '/driver/login',
      };
    }
  }

  async postResubmissionDocuments(data: postResubmissionDocumentsReq): Promise<commonRes> {
    try {
      const { driverId, ...updateData } = data;

      if (!mongoose.Types.ObjectId.isValid(driverId)) {
        throw new Error('Invalid driver ID');
      }

      const resubmission = await this._resubmissionRepo.findOne({
        driverId,
      });
      if (!resubmission) {
        return {
          status: StatusCode.Forbidden,
          message: 'No resubmission data found for driver',
          navigate: '/driver/login',
        };
      }

      const fields = resubmission.fields;

      const update: UpdateQuery<DriverInterface> = {
        accountStatus: AccountStatus.Pending,
      };

      const addToUpdate = <K extends keyof DriverInterface>(
        path: string,
        value: DriverInterface[K] | undefined
      ) => {
        if (value !== undefined && value !== null) {
          (update as Record<string, unknown>)[path] = value;
        }
      };

      for (const field of fields) {
        switch (field) {
          case 'aadhar':
            addToUpdate('aadhar.id', updateData.aadharID);
            addToUpdate('aadhar.frontImageUrl', updateData.aadharFrontImage);
            addToUpdate('aadhar.backImageUrl', updateData.aadharBackImage);
            break;

          case 'license':
            addToUpdate('license.id', updateData.licenseID);
            addToUpdate('license.frontImageUrl', updateData.licenseFrontImage);
            addToUpdate('license.backImageUrl', updateData.licenseBackImage);
            addToUpdate('license.validity', updateData.licenseValidity);
            break;

          case 'registrationId':
            addToUpdate('vehicleDetails.registrationId', updateData.registrationId);
            break;

          case 'model':
            addToUpdate('vehicleDetails.model', updateData.model);
            break;

          case 'rc':
            addToUpdate('vehicleDetails.rcFrontImageUrl', updateData.rcFrontImage);
            addToUpdate('vehicleDetails.rcBackImageUrl', updateData.rcBackImage);
            break;

          case 'carImage':
            addToUpdate('vehicleDetails.carFrontImageUrl', updateData.carFrontImage);
            addToUpdate('vehicleDetails.carBackImageUrl', updateData.carBackImage);
            break;

          case 'insurance':
            addToUpdate('vehicleDetails.insuranceImageUrl', updateData.insuranceImage);
            addToUpdate('vehicleDetails.insuranceStartDate', updateData.insuranceStartDate);
            addToUpdate('vehicleDetails.insuranceExpiryDate', updateData.insuranceExpiryDate);
            break;

          case 'pollution':
            addToUpdate('vehicleDetails.pollutionImageUrl', updateData.pollutionImage);
            addToUpdate('vehicleDetails.pollutionStartDate', updateData.pollutionStartDate);
            addToUpdate('vehicleDetails.pollutionExpiryDate', updateData.pollutionExpiryDate);
            break;

          case 'driverImage':
            addToUpdate('driverImage', updateData.driverImage);
            break;

          case 'location':
            addToUpdate('location.latitude', updateData.latitude);
            addToUpdate('location.longitude', updateData.longitude);
            break;
        }
      }

      const updated = await this._driverRepo.updateProfileById(driverId, update);

      if (!updated) {
        throw new Error('Failed to update driver document');
      }

      await this._resubmissionRepo.deleteOne({ driverId });

      return {
        status: StatusCode.OK,
        message: 'Resubmission document updated successfully',
      };
    } catch (error: unknown) {
      console.error('Service Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: StatusCode.InternalServerError,
        message,
        navigate: '/driver/login',
      };
    }
  }
}
