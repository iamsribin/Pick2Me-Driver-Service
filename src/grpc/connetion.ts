import { paymentProto } from '@pick2me/shared/protos';
import * as grpc from '@grpc/grpc-js';

type PaymentServiceClient = InstanceType<typeof paymentProto.PaymentService>;
console.log(process.env.PAYMENT_GRPC_URL);

const paymentClient = new paymentProto.PaymentService(
  process.env.PAYMENT_GRPC_URL!,
  grpc.credentials.createInsecure()
) as PaymentServiceClient;

export { paymentClient };
