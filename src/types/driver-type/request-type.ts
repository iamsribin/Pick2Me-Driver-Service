export interface UpdateDriverProfileReq {
  driverId: string;
  name: string;
  imageUrl: string;
}

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
  adminShare: string;
  driverShare: string;
  transactionId: string;
}

export interface UpdateRideCount {
  driverId: string;
  status: string;
}
