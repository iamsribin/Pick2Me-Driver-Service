import { IAdminController } from '../interfaces/i-admin-controller';
import { IAdminService } from '@/services/interfaces/i-admin-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { NextFunction, Request, Response } from 'express';
import { recursivelySignImageUrls } from '@/utilities/createImageUrl';
import { BadRequestError } from '@pick2me/shared/errors';
import { StatusCode } from '@pick2me/shared/interfaces';

@injectable()
export class AdminController implements IAdminController {
  constructor(@inject(TYPES.AdminService) private _adminService: IAdminService) {}

  getDriversList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Number(req.query.limit) || 6);
      const status = req.query.status;

      const search = String(req.query.search || '');

      const data = {
        status: status as 'Good' | 'Block',
        page: page as number,
        limit: limit as number,
        search: search.toString().trim(),
      };

      const result = await this._adminService.getDriversList(data);

      res.status(StatusCode.OK).json({
        users: result.drivers || [],
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  GetDriverDetails = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      console.log(id);

      if (!id) throw BadRequestError('id required');

      const response = await this._adminService.getDriverDetailsById(id);
      if (response.data) {
        await recursivelySignImageUrls(response.data as any);
      }

      res.status(+response.status).json(response.data);
    } catch (error: unknown) {
      _next(error);
    }
  };

  updateAccountStatus = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const id = req.params.driverId;
      const { note, status, fields } = req.body;
      console.log({ id, note, status, fields });

      if (!id || !note || !status) throw BadRequestError('some fields is missing');

      const request = { id, reason: note, status, fields };
      console.log({ id, reason: note, status, fields });

      const response = await this._adminService.updateAccountStatus(request);
      console.log('response', response);

      res.status(+response.status).json(response);
    } catch (error) {
      _next(error);
    }
  };
}
