import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { NextFunction, Request, Response } from 'express';
import { AddEarningsRequest } from '@/types';
import { PaymentResponse } from '@/types/driver-type/response-type';

export interface IDriverController {
  fetchDriverProfile(req: Request, res: Response, _next: NextFunction): Promise<void>;

  fetchDriverDocuments(req: Request, res: Response, _next: NextFunction): Promise<void>;

  updateDriverProfile(req: Request, res: Response, _next: NextFunction): Promise<void>;

  updateDriverDocuments(req: Request, res: Response, _next: NextFunction): Promise<void>;

  handleOnlineChange(req: Request, res: Response, _next: NextFunction): Promise<void>;

  // AddEarnings(
  //   call: ServerUnaryCall<AddEarningsRequest, PaymentResponse>,
  //   callback: sendUnaryData<PaymentResponse>
  // ): Promise<void>;

  // getDriverStripe(
  //   call: ServerUnaryCall<{ driverId: string }, { status: string; stripeId: string }>,
  //   callback: sendUnaryData<{ status: string; stripeId: string }>
  // ): Promise<void>;
  // increaseCancelCount(payload: increaseCancelCountReq): Promise<void>;
}
