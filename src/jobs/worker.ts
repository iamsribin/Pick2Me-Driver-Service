import cron from 'node-cron';
import mongoose from 'mongoose';
import { runDocumentExpiryCheck } from './document-expiry-job';

async function start() {
  await mongoose.connect(process.env.MONGO_URL!);

  cron.schedule('0 2 * * *', () => {
    console.info('[expiry-job] cron fired');
    runDocumentExpiryCheck(7, 7).catch((err) => console.error(err));
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
