import { commonRes, IResponse } from '@pick2me/shared/interfaces';
import { DriverDocumentDTO, DriverProfileDTO, MainDashboardDto } from '@/dto/driver.dto';
import {
  AddEarningsRequest,
  FilterType,
  UpdateDriverDocumentsReq,
  UpdateDriverProfileReq,
  UpdateRideCount,
} from '@/types';
import { ActivityResponse, PaymentResponse } from '@/types/driver-type/response-type';

export interface IDriverService {
  fetchDriverProfile(id: string): Promise<IResponse<DriverProfileDTO>>;
  updateDriverProfile(data: UpdateDriverProfileReq): Promise<IResponse<null>>;
  fetchDriverDocuments(id: string): Promise<IResponse<DriverDocumentDTO>>;
  updateDriverDocuments(data: UpdateDriverDocumentsReq): Promise<IResponse<null>>;
  toggleOnline(
    driverId: string,
    goOnline: boolean,
    lat?: number,
    lng?: number
  ): Promise<IResponse<null>>;
  fetchMainDashboard(driverId: string): Promise<MainDashboardDto>;
  addEarnings(earnings: AddEarningsRequest): Promise<commonRes>;
  updateRideCount(payload: UpdateRideCount): Promise<void>;
  getDriverStats(driverId: string, filter: FilterType): Promise<ActivityResponse[]>;
}
