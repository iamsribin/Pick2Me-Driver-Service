import express from 'express';
import { catchAsync } from '@pick2me/shared/utils';
import { RegisterController } from '@/controllers/implementation/register-controller';
import { LoginController } from '@/controllers/implementation/login-controller';
import { container } from '@/config/inversify.config';
import { TYPES } from '@/types/inversify-types';
import { upload } from '@/middleware/multer';

const registrationController = container.get<RegisterController>(TYPES.RegisterController);
const loginController = container.get<LoginController>(TYPES.LoginController);

const authRouter = express.Router();

authRouter.post('/check-login-number', catchAsync(loginController.checkLogin));
authRouter.post('/check-login-email', catchAsync(loginController.checkGoogleLoginDriver));
authRouter.post('/check-registration', catchAsync(registrationController.checkRegisterDriver));
authRouter.post('/register', catchAsync(registrationController.register));
//resubmission
authRouter.get('/documents/resubmission/:id', catchAsync(loginController.getResubmissionDocuments));
authRouter.put(
  '/documents/resubmission/:id',
  upload.any(),
  catchAsync(loginController.postResubmissionDocuments)
);

authRouter.post('/location/register', catchAsync(registrationController.location));
//documents
authRouter.post(
  '/identification/register',
  upload.fields([
    { name: 'aadharFrontImage', maxCount: 1 },
    { name: 'aadharBackImage', maxCount: 1 },
    { name: 'licenseFrontImage', maxCount: 1 },
    { name: 'licenseBackImage', maxCount: 1 },
  ]),
  catchAsync(registrationController.identificationUpdate)
);

authRouter.post(
  '/profile-image/register',
  upload.single('driverImage'),
  catchAsync(registrationController.updateDriverImage)
);

authRouter.post(
  '/vehicle/register',
  upload.fields([
    { name: 'rcFrontImage', maxCount: 1 },
    { name: 'rcBackImage', maxCount: 1 },
    { name: 'carFrontImage', maxCount: 1 },
    { name: 'carSideImage', maxCount: 1 },
  ]),
  catchAsync(registrationController.vehicleUpdate)
);

authRouter.post(
  '/insurance/register',
  upload.fields([
    { name: 'insuranceImage', maxCount: 1 },
    { name: 'pollutionImage', maxCount: 1 },
  ]),
  catchAsync(registrationController.vehicleInsurancePollutionUpdate)
);

// authRouter.get('/refresh', catchAsync(registrationController.refreshToken));
// authRouter.delete('/logout', catchAsync(registrationController.logout));

export { authRouter };
