import { refferalCode } from '@/utilities/referral-code';
import { IDriverRepository } from '@/repositories/interfaces/i-driver-repository';
import { DriverInterface } from '@/interface/driver.interface';
import { IRegistrationService } from '../interfaces/i-registration-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { BadRequestError, HttpError, InternalError, NotFoundError } from '@pick2me/shared/errors';
import { commonRes, StatusCode } from '@pick2me/shared/interfaces';
import uploadToS3, { uploadToS3Public } from '@/utilities/s3';
import {
  CheckRegisterDriverRes,
  IdentificationUpdateReq,
  InsuranceUpdateReq,
  LocationUpdateReq,
  RegisterReq,
  UpdateDriverImageReq,
  VehicleUpdateReq,
} from '@/types';

@injectable()
export class RegistrationService implements IRegistrationService {
  constructor(@inject(TYPES.DriverRepository) private _driverRepo: IDriverRepository) {}

  async register(driverData: RegisterReq): Promise<commonRes> {
    try {
      const { name, email, mobile, password } = driverData;

      const newReferralCode = refferalCode();
      // const hashedPassword = await bcryptService.securePassword(password);

      const newDriver: Partial<DriverInterface> = {
        name,
        email,
        mobile,
        // password: hashedPassword,
        referralCode: newReferralCode,
      };

      const createdDriver = await this._driverRepo.create(newDriver);

      if (!createdDriver) {
        throw NotFoundError('Driver registration failed');
      }

      return {
        status: StatusCode.OK,
        message: 'Success',
        id: createdDriver._id.toString(),
      };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('Driver registration failed');
    }
  }

  async checkRegisterDriver(mobile: number): Promise<CheckRegisterDriverRes> {
    try {
      const driver = await this._driverRepo.getByMobile(mobile);

      //new driver
      if (!driver) {
        return {
          status: StatusCode.OK,
          message: 'Success',
          nextStep: null,
          isFullyRegistered: false,
        };
      }

      const { aadhar, driverImage, vehicleDetails, location, license } = driver;

      // Check for missing resources step-by-step
      if (!aadhar?.id) {
        return {
          status: StatusCode.Accepted,
          message: 'Aadhar document pending',
          nextStep: 'documents',
          driverId: driver._id.toString(),
          isFullyRegistered: false,
        };
      }

      if (!license?.id || !license?.backImageUrl) {
        return {
          status: StatusCode.Accepted,
          message: 'License document pending',
          nextStep: 'documents',
          driverId: driver._id.toString(),
          isFullyRegistered: false,
        };
      }

      if (!driverImage) {
        return {
          status: StatusCode.Accepted,
          message: 'Driver image pending',
          nextStep: 'driverImage',
          driverId: driver._id.toString(),
          isFullyRegistered: false,
        };
      }

      if (!vehicleDetails) {
        return {
          status: StatusCode.Accepted,
          message: 'Vehicle details pending',
          nextStep: 'vehicle',
          driverId: driver._id.toString(),
          isFullyRegistered: false,
        };
      }

      const {
        carFrontImageUrl,
        carBackImageUrl,
        insuranceImageUrl,
        insuranceExpiryDate,
        pollutionImageUrl,
      } = vehicleDetails;

      if (!carFrontImageUrl || !carBackImageUrl) {
        return {
          status: StatusCode.Accepted,
          message: 'Car images pending',
          nextStep: 'vehicle',
          driverId: driver._id.toString(),
          isFullyRegistered: false,
        };
      }

      if (!insuranceImageUrl || !insuranceExpiryDate || !pollutionImageUrl) {
        return {
          status: StatusCode.Accepted,
          message: 'Insurance/Pollution documents pending',
          nextStep: 'insurance',
          driverId: driver._id.toString(),
          isFullyRegistered: false,
        };
      }

      if (!location?.latitude || !location?.longitude) {
        return {
          status: StatusCode.Accepted,
          message: 'Location data pending',
          nextStep: 'location',
          driverId: driver._id.toString(),
          isFullyRegistered: false,
        };
      }

      // All required data present — driver is fully registered
      return {
        status: StatusCode.OK,
        message: 'Driver already registered',
        driverId: driver._id.toString(),
        isFullyRegistered: true,
      };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('Failed to check registration');
    }
  }

  async identificationUpdate(data: IdentificationUpdateReq): Promise<commonRes> {
    try {
      const isRegistered = await this._driverRepo.findById(data.driverId);

      if (!isRegistered) throw BadRequestError('please register before uploading identification');

      let aadharFrontImage = 'sample';
      let aadharBackImage = 'sample';
      let licenseFrontImage = 'sample';
      let licenseBackImage = 'sample';

      [aadharFrontImage, aadharBackImage, licenseFrontImage, licenseBackImage] = await Promise.all([
        uploadToS3(data.files['aadharFrontImage'][0]),
        uploadToS3(data.files['aadharBackImage'][0]),
        uploadToS3(data.files['licenseFrontImage'][0]),
        uploadToS3(data.files['licenseBackImage'][0]),
      ]);

      const { files, ...documents } = data;

      console.log(files);

      const identificationData = {
        ...documents,
        aadharFrontImage,
        aadharBackImage,
        licenseFrontImage,
        licenseBackImage,
      };

      const updated = await this._driverRepo.updateIdentification(identificationData);

      if (!updated) throw BadRequestError('Identification update failed');

      return { status: StatusCode.OK, message: 'Success' };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('Failed to update identification', {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async driverImageUpdate(data: UpdateDriverImageReq): Promise<commonRes> {
    try {
      const isRegistered = await this._driverRepo.findById(data.driverId);

      if (isRegistered) throw BadRequestError('Please register before uploading image');

      const driverImageUrl = await uploadToS3Public(data.file);

      const updated = await this._driverRepo.updateDriverImage({
        driverId: data.driverId,
        imageUrl: driverImageUrl,
      });

      return updated
        ? { status: StatusCode.OK, message: 'Success' }
        : {
            status: StatusCode.BadRequest,
            message: 'Image update failed',
          };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('Failed to update driver image');
    }
  }

  async vehicleUpdate(data: VehicleUpdateReq): Promise<commonRes> {
    try {
      const isRegistered = await this._driverRepo.findById(data.driverId);

      if (!isRegistered) throw BadRequestError('register before uploading documents');

      let rcFrondImageUrl = '';
      let rcBackImageUrl = '';
      let carFrondImageUrl = '';
      let carBackImageUrl = '';

      [rcFrondImageUrl, rcBackImageUrl, carFrondImageUrl, carBackImageUrl] = await Promise.all([
        uploadToS3(data.files['rcFrontImage'][0]),
        uploadToS3(data.files['rcBackImage'][0]),
        uploadToS3(data.files['carFrontImage'][0]),
        uploadToS3(data.files['carSideImage'][0]),
      ]);
      const { files, ...documents } = data;

      console.log(files);

      const vehicleData = {
        ...documents,
        rcFrondImageUrl,
        rcBackImageUrl,
        carFrondImageUrl,
        carBackImageUrl,
      };

      const updated = await this._driverRepo.vehicleUpdate(vehicleData);

      return updated
        ? { status: StatusCode.OK, message: 'Success' }
        : { status: StatusCode.BadRequest, message: 'Update failed' };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('Failed to update vehicle details');
    }
  }

  async locationUpdate(data: LocationUpdateReq): Promise<commonRes> {
    try {
      const updated = await this._driverRepo.locationUpdate(data);

      if (!updated) throw BadRequestError('Location update failed');

      return { status: StatusCode.OK, message: 'Success' };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('Failed to update location');
    }
  }

  async vehicleInsurancePollutionUpdate(data: InsuranceUpdateReq): Promise<commonRes> {
    try {
      const isRegistered = await this._driverRepo.findById(data.driverId);

      if (!isRegistered) throw BadRequestError('register before submitting documents');

      let pollutionImageUrl = '';
      let insuranceImageUrl = '';

      [pollutionImageUrl, insuranceImageUrl] = await Promise.all([
        uploadToS3(data.files['pollutionImage'][0]),
        uploadToS3(data.files['insuranceImage'][0]),
      ]);
      const { files, ...documents } = data;

      console.log(files);

      const pollutionDoc = {
        pollutionImageUrl,
        insuranceImageUrl,
        ...documents,
      };

      const updated = await this._driverRepo.vehicleInsurancePollutionUpdate(pollutionDoc);

      if (!updated) throw BadRequestError('Update failed');

      return { status: StatusCode.OK, message: 'Success' };
    } catch (error: unknown) {
      console.log(error);

      if (error instanceof HttpError) throw error;

      throw InternalError('Failed to update insurance/pollution');
    }
  }

  // async refreshToken(token: string): Promise<IRefreshTokenDto> {
  //   try {
  //     if (!token) throw ForbiddenError('token not provided');
  //     const payload = verifyToken(token, process.env.TOKEN_SECRET! as string) as AccessPayload;

  //     const user = await this._driverRepo.findById(payload.id);
  //     if (!user) throw ForbiddenError('User not found');

  //     if (user.accountStatus === 'Blocked') {
  //       throw UnauthorizedError('Your account has been blocked. Please contact support!');
  //     }

  //     const accessToken = generateJwtToken(
  //       { id: payload.id, role: payload.role },
  //       process.env.TOKEN_SECRET! as string,
  //       '3m'
  //     );

  //     return { accessToken };
  //   } catch (error: unknown) {
  //     if (error instanceof HttpError) throw error;

  //     throw InternalError('Failed to refresh access token');
  //   }
  // }
}
