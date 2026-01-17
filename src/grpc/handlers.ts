import { IDriverController } from '@/controllers/interfaces/i-driver-controller';

type Handlers = {
  driverController: IDriverController;
};

export function createDriverHandlers(controllers: Handlers) {
  const { driverController } = controllers;

  return {
    AddEarnings: driverController.AddEarnings.bind(driverController),
    // getDriverStripe: driverController.getDriverStripe.bind(driverController),
  };
}
