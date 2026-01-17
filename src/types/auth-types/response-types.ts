import { StatusCode } from '@pick2me/shared/interfaces';
import { ResubmissionInterface } from '@/interface/resubmission.interface';

export interface CheckLoginDriverRes {
  status: StatusCode;
  message: string;
  navigate?: string;
  name?: string;
  refreshToken?: string;
  token?: string;
  id?: string;
}

export interface CheckRegisterDriverRes {
  status: StatusCode;
  message: string;
  isFullyRegistered?: boolean;
  driverId?: string;
  nextStep?: 'documents' | 'driverImage' | 'location' | 'insurance' | 'vehicle' | null;
}

export interface GetResubmissionDocumentsRes {
  status: StatusCode;
  message: string;
  navigate?: string;
  data?: ResubmissionInterface;
}
