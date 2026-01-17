import { IDriverController } from '../interfaces/i-driver-controller';
import { IDriverService } from '@/services/interfaces/i-driver-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { NextFunction, Request, Response } from 'express';
import uploadToS3, { uploadToS3Public } from '@/utilities/s3';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { PaymentResponse } from '@/types/driver-type/response-type';
import { BadRequestError } from '@pick2me/shared/errors';
import { commonRes, StatusCode } from '@pick2me/shared/interfaces';
import { recursivelySignImageUrls } from '@/utilities/createImageUrl';
import { AddEarningsRequest, SectionUpdates } from '@/types';

@injectable()
export class DriverController implements IDriverController {
  constructor(
    @inject(TYPES.DriverService)
    private readonly _driverService: IDriverService
  ) { }

  fetchDriverProfile = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache');

      const user = req.gatewayUser!;
      console.log(user);

      const response = await this._driverService.fetchDriverProfile(user.id);

      res.status(+response.status).json(response.data);
    } catch (error) {
      console.log(error);
      _next(error);
    }
  };

  updateDriverProfile = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const file: Express.Multer.File | undefined = req.file;

      const user = req.gatewayUser!;

      let imageUrl: string | null = null;

      if (file) imageUrl = await uploadToS3Public(file);

      const { name } = req.body;

      const data = {
        driverId: user.id,
        ...(name && { name }),
        ...(imageUrl && { imageUrl }),
      };

      const response = await this._driverService.updateDriverProfile(data);
      res.clearCookie('refreshToken');
      res.status(+response.status).json(response);
    } catch (error) {
      _next(error);
    }
  };

  fetchDriverDocuments = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache');

      const user = req.gatewayUser!;

      const response = await this._driverService.fetchDriverDocuments(user.id);
      await recursivelySignImageUrls(response.data as unknown as Record<string, unknown>);

      res.status(+response.status).json(response.data);
    } catch (error) {
      console.log(error);
      _next(error);
    }
  };

  updateDriverDocuments = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.gatewayUser!;

      const fields = req.body;

      if (!fields) throw BadRequestError('No fields to update');

      let section = String(req.body.section || 'vehicleDetails');

      const files = req.files as
        | Express.Multer.File[]
        | Record<string, Express.Multer.File[]>
        | undefined;

      const fileUrls: Record<string, string> = {};
      if (files) {
        if (Array.isArray(files)) {
          for (const file of files) {
            const s3Url = await uploadToS3(file);
            fileUrls[file.fieldname] = s3Url;
          }
        } else {
          const entries = Object.entries(files);
          for (const [fieldname, arr] of entries) {
            if (arr && arr.length) {
              fileUrls[fieldname] = await uploadToS3(arr[0]);
            }
          }
        }
      }

      if (!['vehicleDetails', 'license', 'aadhar'].includes(section)) {
        section = 'vehicleDetails';
      }

      const updatesObj = { ...fields, ...fileUrls };

      const payload = {
        driverId: user.id,
        section: section,
        updates: updatesObj as SectionUpdates,
      };

      const response = await this._driverService.updateDriverDocuments(payload);
      res.clearCookie('refreshToken');
      res.status(Number(response.status)).json(response);
    } catch (error) {
      _next(error);
    }
  };

  handleOnlineChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driver = req.gatewayUser;
      const { online, latitude, longitude } = req.body;

      const result = await this._driverService.toggleOnline(driver.id, online, latitude, longitude);
      res.status(+result.status).json(result.message);
    } catch (err) {
      return next(err);
    }
  };

  fetchMainDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driver = req.gatewayUser;
      const response = await this._driverService.fetchMainDashboard(driver.id);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  AddEarnings = async (
    call: ServerUnaryCall<AddEarningsRequest, PaymentResponse>,
    callback: sendUnaryData<commonRes>
  ): Promise<void> => {
    try {
      console.log('call.request', call.request);

      const response = await this._driverService.addEarnings(call.request);
      callback(null, response);
    } catch (error) {
      console.log(error);
      callback(null, {
        status: StatusCode.InternalServerError,
        message: (error as Error).message,
      });
    }
  };

  getDriverStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driver = req.gatewayUser;
      const filter = (req.query.filter as 'day' | 'month' | 'year') || 'month';
      const response = await this._driverService.getDriverStats(driver.id, filter);
      res.status(StatusCode.OK).json({ data: response });
    } catch (error) {
      next(error);
    }
  };
}
