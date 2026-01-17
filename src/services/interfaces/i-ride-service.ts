import { IResponse } from '@pick2me/shared/interfaces';
import { OnlineDriverDTO } from '@/dto/ride.dto';

export interface IRideService {
  getOnlineDriverDetails(id: string): Promise<IResponse<OnlineDriverDTO>>;
  updateDriverCancelCount(id: string): Promise<IResponse<null>>;
}
