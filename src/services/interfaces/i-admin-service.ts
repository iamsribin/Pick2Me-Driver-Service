import { IResponse } from '@pick2me/shared/interfaces';
import { AdminUpdateDriverStatusReq } from '@/types';
import { AdminDriverDetailsDTO, PaginatedUserListDTO } from '@/dto/admin.dto';

export interface IAdminService {
  getDriversList(data: {
    status: 'Good' | 'Block';
    page: number;
    limit: number;
    search: string;
  }): Promise<PaginatedUserListDTO>;
  getDriverDetailsById(id: string): Promise<IResponse<AdminDriverDetailsDTO>>;
  updateAccountStatus(request: AdminUpdateDriverStatusReq): Promise<IResponse<boolean>>;

  // getDriversListByAccountStatus(data: {
  //   status: 'Good' | 'Block';
  //   page: number;
  //   limit: number;
  //   search: string;
  // }): Promise<IResponse<PaginatedUserListDTO>>;
}
