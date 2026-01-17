import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { OnlineDriverDTO } from '@/dto/ride.dto';
import { Id } from '@/types';
import { IResponse } from '@pick2me/shared/interfaces';

export interface IRideController {
  getOnlineDriverDetails(
    call: ServerUnaryCall<Id, IResponse<OnlineDriverDTO>>,
    callback: sendUnaryData<IResponse<OnlineDriverDTO>>
  ): Promise<void>;
  updateDriverCancelCount(
    call: ServerUnaryCall<Id, IResponse<null>>,
    callback: sendUnaryData<IResponse<null>>
  ): Promise<void>;
}
