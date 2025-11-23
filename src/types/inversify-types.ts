export const TYPES = {
  AdminController: Symbol.for('AdminController'),
  DriverController: Symbol.for('DriverController'),
  LoginController: Symbol.for('LoginController'),
  RegisterController: Symbol.for('RegisterController'),
  RideController: Symbol.for('RideController'),

  BaseRepository: Symbol.for('BaseRepository'),
  ResubmissionRepository: Symbol.for('ResubmissionRepository'),
  DriverRepository: Symbol.for('DriverRepository'),
  RideRepository: Symbol.for('RideRepository'),
  AdminRepository: Symbol.for('AdminRepository'),
  DailyStatusRepository: Symbol.for('DailyStatusRepository'),

  AdminService: Symbol.for('AdminService'),
  DriverService: Symbol.for('DriverService'),
  LoginService: Symbol.for('LoginService'),
  RegistrationService: Symbol.for('RegistrationService'),
  RideService: Symbol.for('RideService'),
};
