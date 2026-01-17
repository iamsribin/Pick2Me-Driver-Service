import 'dotenv/config';

import app from './app';
import { startGrpcServer } from './grpc/server';
import { isEnvDefined } from './utilities/envChecker';
import { createRedisService } from '@pick2me/shared/redis';
import { connectDB } from '@pick2me/shared/mongo';
import './jobs/worker';
import { listenForExpiredKeys } from './jobs/check-hardbeat-expiry';
import { EventConsumer } from './events/consumer';

// server
const startServer = async () => {
  try {
    // check all env are defined
    isEnvDefined();

    // connect to db
    connectDB(process.env.MONGO_URL!);

    //creating redis server
    createRedisService(process.env.REDIS_URL as string);
    //
    listenForExpiredKeys();

    //start rabbit consumer
    EventConsumer.init();

    // start grpc server
    startGrpcServer();

    //listen to port
    app.listen(process.env.PORT, () =>
      console.log(`Driver service running on port ${process.env.PORT}`)
    );
  } catch (err: unknown) {
    console.log(err);
  }
};

startServer();
