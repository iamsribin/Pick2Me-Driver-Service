import { commonRes } from '@pick2me/shared/interfaces';
import { postResubmissionDocumentsReq } from '@/types';
import {
  CheckLoginDriverRes,
  GetResubmissionDocumentsRes,
} from '@/types/auth-types/response-types';

export interface ILoginService {
  loginCheckDriver(mobile: number): Promise<CheckLoginDriverRes>;
  checkGoogleLoginDriver(email: string): Promise<CheckLoginDriverRes>;
  getResubmissionDocuments(id: string): Promise<GetResubmissionDocumentsRes>;
  postResubmissionDocuments(data: postResubmissionDocumentsReq): Promise<commonRes>;
}
