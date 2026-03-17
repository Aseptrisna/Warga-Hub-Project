import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { CitizensModule } from '../citizens/citizens.module';
import { IuranTypesModule } from '../iuran-types/iuran-types.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    NotificationsModule,
    CitizensModule,
    IuranTypesModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
