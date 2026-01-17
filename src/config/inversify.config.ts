import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '@/types/inversify-types';

// Controllers
import { AdminController } from '@/controllers/implementation/admin-controller';
import { DriverController } from '@/controllers/implementation/driver-controller';
import { LoginController } from '@/controllers/implementation/login-controller';
import { RegisterController } from '@/controllers/implementation/register-controller';
import { RideController } from '@/controllers/implementation/ride-controller';

// Repositories
import { AdminRepository } from '@/repositories/implementation/admin-repository';
import { DriverRepository } from '@/repositories/implementation/driver-repository';
import { RideRepository } from '@/repositories/implementation/ride-repository';

// Services
import { AdminService } from '@/services/implementation/admin-service';
import { DriverService } from '@/services/implementation/driver-service';
import { LoginService } from '@/services/implementation/login-service';
import { RegistrationService } from '@/services/implementation/registration-service';
import { RideService } from '@/services/implementation/ride-service';

// Interfaces
import { IAdminController } from '@/controllers/interfaces/i-admin-controller';
import { IDriverController } from '@/controllers/interfaces/i-driver-controller';
import { ILoginController } from '@/controllers/interfaces/i-login-controller';
import { IRegisterController } from '@/controllers/interfaces/i-register-controller';
import { IRideController } from '@/controllers/interfaces/i-ride-controller';

import { IAdminService } from '@/services/interfaces/i-admin-service';
import { IDriverService } from '@/services/interfaces/i-driver-service';
import { ILoginService } from '@/services/interfaces/i-login-service';
import { IRegistrationService } from '@/services/interfaces/i-registration-service';
import { IRideService } from '@/services/interfaces/i-ride-service';

import { IAdminRepository } from '@/repositories/interfaces/i-admin-repository';
import { IDriverRepository } from '@/repositories/interfaces/i-driver-repository';
import { IRideRepository } from '@/repositories/interfaces/i-ride-repository';

import { ResubmissionInterface } from '@/interface/resubmission.interface';
import { ResubmissionModel } from '@/model/resubmission.model';
import { IMongoBaseRepository, MongoBaseRepository } from '@pick2me/shared/mongo';
import { DailyStatusRepository } from '@/repositories/implementation/daily-status-repository';
import { IDailyStatusRepository } from '@/repositories/interfaces/i-daily-satus-repository';

const container = new Container();

// Controllers
container.bind<IAdminController>(TYPES.AdminController).to(AdminController);
container.bind<IDriverController>(TYPES.DriverController).to(DriverController);
container.bind<ILoginController>(TYPES.LoginController).to(LoginController);
container.bind<IRegisterController>(TYPES.RegisterController).to(RegisterController);
container.bind<IRideController>(TYPES.RideController).to(RideController);

// Services
container.bind<IAdminService>(TYPES.AdminService).to(AdminService);
container.bind<IDriverService>(TYPES.DriverService).to(DriverService);
container.bind<ILoginService>(TYPES.LoginService).to(LoginService);
container.bind<IRegistrationService>(TYPES.RegistrationService).to(RegistrationService);
container.bind<IRideService>(TYPES.RideService).to(RideService);

// Repositories
// container.bind<IMongoBaseRepository<DriverInterface>>(TYPES.BaseRepository).to(MongoBaseRepository);
container.bind<IAdminRepository>(TYPES.AdminRepository).to(AdminRepository);
container.bind<IDriverRepository>(TYPES.DriverRepository).to(DriverRepository);
container.bind<IDailyStatusRepository>(TYPES.DailyStatusRepository).to(DailyStatusRepository);
container.bind<IRideRepository>(TYPES.RideRepository).to(RideRepository);
container
  .bind<IMongoBaseRepository<ResubmissionInterface>>(TYPES.ResubmissionRepository)
  .toDynamicValue(() => new MongoBaseRepository<ResubmissionInterface>(ResubmissionModel))
  .inSingletonScope();

export { container };
