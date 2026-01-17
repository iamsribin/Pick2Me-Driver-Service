export interface UpdateDriverProfileReq {
  driverId: string;
  name: string;
  imageUrl: string;
}

export type FilterType = 'day' | 'month' | 'year';


type AadharUpdates = {
  id?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
};

type LicenseUpdates = {
  id?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  validity?: string;
};

type VehicleRCUpdates = {
  registrationId?: string;
  rcFrontImageUrl?: string;
  rcBackImageUrl?: string;
  rcStartDate?: string;
  rcExpiryDate?: string;
};

type VehicleDetailsUpdates = {
  vehicleNumber?: string;
  vehicleColor?: string;
  model?: string;
  carFrontImageUrl?: string;
  carBackImageUrl?: string;
};

type InsuranceUpdates = {
  insuranceImageUrl?: string;
  insuranceStartDate?: string;
  insuranceExpiryDate?: string;
};

type PollutionUpdates = {
  pollutionImageUrl?: string;
  pollutionStartDate?: string;
  pollutionExpiryDate?: string;
};

export type SectionUpdates =
  | AadharUpdates
  | LicenseUpdates
  | VehicleRCUpdates
  | VehicleDetailsUpdates
  | InsuranceUpdates
  | PollutionUpdates;

export interface UpdateDriverDocumentsReq {
  driverId: string;
  section: string;
  updates: SectionUpdates;
}

export interface AddEarningsRequest {
  driverId: string;
  platformFee: bigint;
  driverShare: bigint;
  userId: string;
  bookingId: string;
  isAddCommission: boolean;
}

export interface UpdateRideCount {
  driverId: string;
  status: string;
}
