import * as grpc from '@grpc/grpc-js';
import { driverServiceDescriptor } from '@pick2me/shared/protos';
import { createDriverHandlers } from './handlers';
import { container } from '../config/inversify.config';
import { TYPES } from '../types/inversify-types';
import { IDriverController } from '../controllers/interfaces/i-driver-controller';

if (!driverServiceDescriptor) {
  console.error('userServiceDescriptor is missing. Inspect loaded proto package.');
  process.exit(1);
}

const driverController = container.get<IDriverController>(TYPES.DriverController);

const handlers = createDriverHandlers({
  driverController,
});

export const startGrpcServer = () => {
  try {
    const server = new grpc.Server();

    // Register driver service gRPC functions
    server.addService(driverServiceDescriptor, handlers);

    // Bind server
    server.bindAsync(
      process.env.DRIVER_GRPC_URL as string,
      grpc.ServerCredentials.createInsecure(),
      () => {
        console.log(`GRPC server for user service running on port ${process.env.DRIVER_GRPC_URL}`);
      }
    );
  } catch (err) {
    console.log(err);
  }
};
