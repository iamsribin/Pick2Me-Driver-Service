import express from 'express';
import { upload } from '../middleware/multer';
import { container } from '../config/inversify.config';
import { DriverController } from '../controllers/implementation/driver-controller';
import { TYPES } from '../types/inversify-types';
import { verifyGatewayJwt } from '@Pick2Me/shared/auth';
import { catchAsync } from '@Pick2Me/shared/utils';

const driverController = container.get<DriverController>(TYPES.DriverController);

const driverRouter = express.Router();

//  All routes below require a valid gateway JWT
driverRouter.use(verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

driverRouter.post('/me/online-status', catchAsync(driverController.handleOnlineChange));
driverRouter.get('/me', catchAsync(driverController.fetchDriverProfile));
driverRouter.get('/me/documents', catchAsync(driverController.fetchDriverDocuments));
driverRouter.get('/me/main-dashboard', catchAsync(driverController.fetchMainDashboard));
driverRouter.put(
  '/me/profile-image',
  upload.single('profilePhoto'),
  catchAsync(driverController.updateDriverProfile)
);

driverRouter.put('/me/documents', upload.any(), catchAsync(driverController.updateDriverDocuments));

driverRouter.post(
  '/me/upload-chat-file',
  upload.fields([{ name: 'file', maxCount: 1 }]),
  catchAsync(driverController.uploadChatFile)
);

export { driverRouter };
