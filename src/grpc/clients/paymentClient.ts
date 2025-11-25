import { paymentClient } from '../connetion';
import { promisify } from 'util';

interface CreateDriverConnectAccountRequest {
  email: string;
  driverId: string;
}
export interface CreateDriverConnectAccountResponse {
  accountId: string;
  accountLinkUrl?: string;
}

export const createDriverConnectAccountRpc = promisify<
  CreateDriverConnectAccountRequest,
  CreateDriverConnectAccountResponse
>(paymentClient.createDriverConnectAccount.bind(paymentClient));

export const checkDriverOnboardingStatus = promisify<
  { driverId: string },
  { onboardingStatus: boolean }
>(paymentClient.CheckDriverOnboardingStatus.bind(paymentClient));
