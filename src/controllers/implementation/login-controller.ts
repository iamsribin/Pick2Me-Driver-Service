import { ILoginService } from '@/services/interfaces/i-login-service';
import { ILoginController } from '../interfaces/i-login-controller';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { NextFunction, Request, Response } from 'express';
import uploadToS3, { uploadToS3Public } from '@/utilities/s3';
import { BadRequestError } from '@pick2me/shared/errors';

@injectable()
export class LoginController implements ILoginController {
  constructor(@inject(TYPES.LoginService) private _loginService: ILoginService) {}

  checkLogin = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const mobile = req.body.mobile;
      console.log('uiuiui');

      if (!mobile) BadRequestError('mobile number is missing');

      const response = await this._loginService.loginCheckDriver(mobile);

      const { refreshToken, token, ...responseWithoutToken } = response;

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 day
      });

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3 * 60 * 1000, //3 min
      });

      res.status(+response.status).json(responseWithoutToken);
      console.log(responseWithoutToken);
    } catch (error: unknown) {
      console.log('Error in checkLogin:', error);

      _next(error);
    }
  };

  checkGoogleLoginDriver = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const email = req.body.email;
      if (!email) throw BadRequestError('Email is required');

      const response = await this._loginService.checkGoogleLoginDriver(email);

      const { refreshToken, token, ...responseWithoutToken } = response;

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 day
      });

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3 * 60 * 1000, //3 min
      });

      res.status(+response.status).json(responseWithoutToken);
    } catch (error: unknown) {
      _next(error);
    }
  };

  getResubmissionDocuments = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      if (!id) throw BadRequestError('Driver ID is required');

      const response = await this._loginService.getResubmissionDocuments(id);
      console.log(response);

      res.status(+response.status).json(response);
    } catch (error: unknown) {
      _next(error);
    }
  };

  postResubmissionDocuments = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const driverId = req.params.id;
      const rawFiles = req.files;

      if (!driverId) throw BadRequestError('Driver ID is required');
      if (!rawFiles) throw BadRequestError('Files are required');

      const filesMap: Record<string, Express.Multer.File[]> = {};

      if (Array.isArray(rawFiles)) {
        for (const f of rawFiles as Express.Multer.File[]) {
          if (!filesMap[f.fieldname]) filesMap[f.fieldname] = [];
          filesMap[f.fieldname].push(f);
        }
      } else {
        Object.assign(filesMap, rawFiles as Record<string, Express.Multer.File[]>);
      }

      const fileFields = [
        'aadharFrontImage',
        'aadharBackImage',
        'licenseFrontImage',
        'licenseBackImage',
        'rcFrontImage',
        'rcBackImage',
        'carFrontImage',
        'carBackImage',
        'insuranceImage',
        'pollutionImage',
        'driverImage',
      ];

      const uploadPromises: Promise<void>[] = [];
      const fileUrls: { [key: string]: string } = {};

      for (const field of fileFields) {
        const filesForField = filesMap[field];
        if (!filesForField || filesForField.length === 0) continue;

        const fileToUpload = filesForField[0];
        if (field == 'driverImage') {
          const p = uploadToS3Public(fileToUpload)
            .then((url) => {
              fileUrls[field] = url;
            })
            .catch((err) => {
              throw err;
            });

          uploadPromises.push(p);
        } else {
          const p = uploadToS3(fileToUpload)
            .then((url) => {
              fileUrls[field] = url;
            })
            .catch((err) => {
              throw err;
            });

          uploadPromises.push(p);
        }
      }

      await Promise.all(uploadPromises);

      const payload = {
        driverId,
        ...req.body,
        ...fileUrls,
      };

      const response = await this._loginService.postResubmissionDocuments(payload);

      res.status(+response.status).json(response);
    } catch (error: unknown) {
      _next(error);
    }
  };
}
