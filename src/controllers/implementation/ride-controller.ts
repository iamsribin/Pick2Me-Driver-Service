import { IRideController } from '../interfaces/i-ride-controller';
import { IRideService } from '@/services/interfaces/i-ride-service';
import { Id } from '@/types';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { OnlineDriverDTO } from '@/dto/ride.dto';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IResponse, StatusCode } from '@pick2me/shared/interfaces';

@injectable()
export class RideController implements IRideController {
  constructor(@inject(TYPES.RideService) private _rideService: IRideService) {}

  async getOnlineDriverDetails(
    call: ServerUnaryCall<Id, IResponse<OnlineDriverDTO>>,
    callback: sendUnaryData<IResponse<OnlineDriverDTO>>
  ): Promise<void> {
    try {
      const { id } = call.request;
      const response = await this._rideService.getOnlineDriverDetails(id);
      callback(null, response);
    } catch (error) {
      callback(null, {
        status: StatusCode.InternalServerError,
        message: (error as Error).message,
      });
    }
  }

  async updateDriverCancelCount(
    call: ServerUnaryCall<Id, IResponse<null>>,
    callback: sendUnaryData<IResponse<null>>
  ): Promise<void> {
    try {
      const { id } = call.request;
      const response = await this._rideService.updateDriverCancelCount(id);
      callback(null, response);
    } catch (error) {
      callback(null, {
        status: StatusCode.InternalServerError,
        message: (error as Error).message,
      });
    }
  }
}
