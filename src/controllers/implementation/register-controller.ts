import { IRegisterController } from '../interfaces/i-register-controller';
import { IRegistrationService } from '@/services/interfaces/i-registration-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { BadRequestError } from '@pick2me/shared/errors';
import { NextFunction, Request, Response } from 'express';

@injectable()
export class RegisterController implements IRegisterController {
  constructor(
    @inject(TYPES.RegistrationService)
    private _registrationService: IRegistrationService
  ) {}

  register = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { name, email, mobile, password, reffered_code } = req.body;

      if (!name || !email || !mobile || !password) throw BadRequestError('All fields are required');

      const userData = {
        name,
        email,
        mobile,
        password,
        referralCode: reffered_code,
      };
      const response = await this._registrationService.register(userData);
      res.status(+response.status).json(response);
    } catch (error) {
      _next(error);
    }
  };

  checkRegisterDriver = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { mobile } = req.body;

      if (!mobile) throw BadRequestError('Mobile number is required');

      const response = await this._registrationService.checkRegisterDriver(mobile);

      res.status(+response.status).json(response);
    } catch (error: unknown) {
      _next(error);
    }
  };

  identificationUpdate = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      if (!files) throw BadRequestError('Files are required');

      const data = {
        ...req.body,
        ...req.query,
        files,
      };

      const response = await this._registrationService.identificationUpdate(data);
      res.status(+response.status).json(response);
    } catch (error) {
      _next(error);
    }
  };

  updateDriverImage = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const file: Express.Multer.File | undefined = req.file;
      const driverId = req.query.driverId as string;

      if (!driverId) throw BadRequestError('Driver ID is required');
      if (!file) throw BadRequestError('Driver Image is required');

      const request = {
        driverId: driverId?.toString(),
        file: file,
      };

      const response = await this._registrationService.driverImageUpdate(request);
      res.status(+response.status).json(response);
    } catch (error) {
      _next(error);
    }
  };

  vehicleUpdate = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      if (!files) throw BadRequestError('some fields are missing');

      const request = {
        ...req.body,
        ...req.query,
        files,
      };

      const response = await this._registrationService.vehicleUpdate(request);
      res.status(+response.status).json(response);
    } catch (error) {
      _next(error);
    }
  };

  vehicleInsurancePollutionUpdate = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      if (!files) throw BadRequestError('Files are required');

      const request = {
        ...req.query,
        ...req.body,
        files,
      };

      const response = await this._registrationService.vehicleInsurancePollutionUpdate(request);
      res.status(+response.status).json(response);
    } catch (error) {
      _next(error);
    }
  };

  location = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const request = { ...req.body, ...req.query };
      const response = await this._registrationService.locationUpdate(request);
      res.status(+response.status).json(response);
    } catch (error) {
      _next(error);
    }
  };

  // logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     console.log('logout');

  //     res.clearCookie('refreshToken');
  //     res.status(StatusCode.OK).json({
  //       message: 'successfully logged out',
  //     });
  //   } catch (err) {
  //     console.log('err', err);

  //     next(err);
  //   }
  // };

  // refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const refreshToken = req.cookies.refreshToken;

  //     if (!refreshToken) throw ForbiddenError('No refresh token provided');

  //     const accessToken = await this._registrationService.refreshToken(refreshToken);
  //     res.status(200).json(accessToken);
  //   } catch (err: unknown) {
  //     next(err);
  //   }
  // };
}
