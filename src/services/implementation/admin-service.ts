import mongoose from 'mongoose';
import { ResubmissionInterface } from '@/interface/resubmission.interface';
import { IAdminService } from '../interfaces/i-admin-service';
import { IAdminRepository } from '@/repositories/interfaces/i-admin-repository';
import { AdminUpdateDriverStatusReq } from '@/types';
import { IDriverRepository } from '@/repositories/interfaces/i-driver-repository';
import { TYPES } from '@/types/inversify-types';
import { inject, injectable } from 'inversify';
import { AdminDriverDetailsDTO, DriverListDTO, PaginatedUserListDTO } from '@/dto/admin.dto';
import {
  BadRequestError,
  ConflictError,
  HttpError,
  InternalError,
  NotFoundError,
} from '@Pick2Me/shared/errors';
import { IResponse, StatusCode } from '@Pick2Me/shared/interfaces';
import { IMongoBaseRepository } from '@Pick2Me/shared/mongo';
import { getRedisService } from '@Pick2Me/shared/redis';

import {
  CreateDriverConnectAccountResponse,
  createDriverConnectAccountRpc,
} from '@/grpc/clients/paymentClient';
import { ServiceError } from '@grpc/grpc-js';
import { generateStatusEmail } from '@/utilities/generate-status-email';
import { sendMail } from '@/utilities/node-mailer';

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.AdminRepository) private _adminRepo: IAdminRepository,
    @inject(TYPES.DriverRepository) private _driverRepo: IDriverRepository,
    @inject(TYPES.ResubmissionRepository)
    private _resubmissionRepo: IMongoBaseRepository<ResubmissionInterface>
  ) {}

  async getDriversList(paginationQuery: {
    status: 'Good' | 'Block';
    page: number;
    limit: number;
    search: string;
  }): Promise<PaginatedUserListDTO> {
    try {
      const validatedPage = Math.max(1, paginationQuery.page);
      const validatedLimit = Math.min(50, Math.max(1, paginationQuery.limit));
      const trimmedSearch = paginationQuery.search.trim();

      const { drivers, totalItems } = await this._adminRepo.findUsersByStatusWithPagination(
        paginationQuery.status,
        validatedPage,
        validatedLimit,
        trimmedSearch
      );

      if (!drivers.length) {
        return {
          drivers: [],
          pagination: {
            currentPage: validatedPage,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: validatedLimit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      const result: DriverListDTO[] = drivers.map((driver) => ({
        id: driver._id.toString(),
        name: driver.name,
        email: driver.email,
        mobile: driver.mobile,
        joiningDate: driver.joiningDate.toISOString(),
        accountStatus: driver.accountStatus,
        vehicle: driver.vehicleDetails.model,
        avatar: driver.driverImage,
      }));

      const totalPages = Math.ceil(totalItems / validatedLimit);

      return {
        drivers: result,
        pagination: {
          currentPage: validatedPage,
          totalPages,
          totalItems,
          itemsPerPage: validatedLimit,
          hasNextPage: validatedPage < totalPages,
          hasPreviousPage: validatedPage > 1,
        },
      };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong', {
        details: { cause: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async getDriverDetailsById(id: string): Promise<IResponse<AdminDriverDetailsDTO>> {
    try {
      const response = await this._driverRepo.findById(id, '-password -referralCode');

      if (!response) {
        throw NotFoundError('driver not found');
      }

      const result: AdminDriverDetailsDTO = {
        name: response.name,
        aadhar: response.aadhar,
        isOnline: response.onlineStatus || false,
        accountStatus: response.accountStatus,
        adminCommission: response.adminCommission || 0,
        address: response.location.address,
        driverImage: response.driverImage,
        email: response.email,
        id: response._id.toString(),
        insurance: {
          insuranceExpiryDate: response.vehicleDetails.insuranceExpiryDate.toISOString(),
          insuranceStartDate: response.vehicleDetails.insuranceStartDate.toISOString(),
          insuranceImageUrl: response.vehicleDetails.insuranceImageUrl,
        },
        joiningDate: new Date(response.joiningDate).toLocaleDateString(),
        license: {
          validity: response.license.validity.toISOString(),
          backImageUrl: response.license.backImageUrl,
          frontImageUrl: response.license.frontImageUrl,
          id: response.license.id,
        },
        lifeTimeEarnings: 0,
        mobile: response.mobile,
        pollution: {
          pollutionExpiryDate: response.vehicleDetails.pollutionExpiryDate.toISOString(),
          pollutionStartDate: response.vehicleDetails.pollutionStartDate.toISOString(),
          pollutionImageUrl: response.vehicleDetails.pollutionImageUrl,
        },
        todayEarnings: 0,
        totalCancelledRides: 0,
        totalCompletedRides: 0,
        totalRating: 0,
        feedbackCount: 0,
        transactionCount: 0,
        walletBalance: 0,
        rc: {
          rcBackImageUrl: response.vehicleDetails.rcBackImageUrl,
          rcExpiryDate: response.vehicleDetails.rcExpiryDate.toISOString(),
          rcFrontImageUrl: response.vehicleDetails.rcFrontImageUrl,
          rcStartDate: response.vehicleDetails.rcStartDate.toISOString(),
          registrationId: response.vehicleDetails.registrationId,
        },
        vehicle: {
          carBackImageUrl: response.vehicleDetails.carBackImageUrl,
          carFrontImageUrl: response.vehicleDetails.carFrontImageUrl,
          model: response.vehicleDetails.model,
          vehicleColor: response.vehicleDetails.vehicleColor,
          vehicleNumber: response.vehicleDetails.vehicleNumber,
        },
      };

      return {
        message: 'success',
        status: StatusCode.OK,
        data: result,
      };
    } catch (error: unknown) {
      console.log(error);
      if (error instanceof HttpError) throw error;

      throw InternalError('something went wrong', {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async updateAccountStatus(request: AdminUpdateDriverStatusReq): Promise<IResponse<boolean>> {
    try {
      // add resubmission fields if admin reject the documents
      if (request.status === 'Rejected') {
        if (!request.fields) throw BadRequestError('fields requires');
        const resubmissionData = {
          driverId: new mongoose.Types.ObjectId(request.id),
          fields: request.fields as ResubmissionInterface['fields'],
        };

        const existing = await this._resubmissionRepo.findOne({
          driverId: request.id,
        });

        if (existing) {
          await this._resubmissionRepo.updateOne(
            { driverId: request.id },
            { $set: { fields: resubmissionData.fields } }
          );
        } else {
          await this._resubmissionRepo.create(resubmissionData as ResubmissionInterface);
        }
      }

      const driver = await this._driverRepo.findById(request.id);

      if (!driver) throw NotFoundError('Driver not found');

      if (!driver?.email) {
        throw NotFoundError('Driver email not found');
      }

      const redisService = await getRedisService();
      const isOnline = await redisService.isDriverOnline(request.id);

      if (isOnline && request.status === 'Blocked') {
        throw ConflictError('Driver is currently on a ride. Block after ride completion');
      }

      let connectResult: CreateDriverConnectAccountResponse | null = null;

      const shouldCreateAccount =
        request.status === 'Good' && !!driver.email && !!driver._id && !driver.accountId;

      if (shouldCreateAccount) {
        console.log('calling');

        try {
          // call payment-service RPC (idempotency handled by payment service)
          connectResult = await createDriverConnectAccountRpc({
            email: driver.email,
            driverId: driver._id.toString(),
          });
        } catch (err) {
          const grpcErr = err as ServiceError;
          console.error('Failed to create connect account', {
            driverId: driver._id,
            error: grpcErr.message,
          });
          throw InternalError('Failed to create payment account for driver');
        }
      }

      const updateData = {
        accountStatus: request.status,
        ...(connectResult?.accountId
          ? { accountId: connectResult.accountId, accountLinkUrl: connectResult.accountLinkUrl }
          : {}),
      };
      console.log('updateData', updateData);

      await this._driverRepo.update(request.id, updateData);

      if (request.status == 'Blocked') {
        redisService.addBlacklistedToken(request.id, 180);
      }

      const subjectAndText = generateStatusEmail(request.status, driver.name, request.reason);

      await sendMail(driver.email, subjectAndText.subject, subjectAndText.text);
      return {
        status: StatusCode.OK,
        message: 'Success',
        data: true,
      };
    } catch (error: unknown) {
      if (error instanceof HttpError) throw error;

      throw InternalError('Failed to check Google login', {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
}
