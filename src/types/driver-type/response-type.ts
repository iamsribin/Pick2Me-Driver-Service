export interface PaymentResponse {
  status: string;
  message: string;
}

export interface ActivityResponse {
  date: string;
  onlineMinutes: number;
  completedRides: number;
  cancelledRides: number;
  earnings: number;
}