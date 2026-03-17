import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PanicService } from './panic.service';
import { PanicController } from './panic.controller';
import { PanicAlert, PanicAlertSchema } from './schemas/panic-alert.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PanicAlert.name, schema: PanicAlertSchema }]),
    NotificationsModule,
  ],
  controllers: [PanicController],
  providers: [PanicService],
  exports: [PanicService],
})
export class PanicModule {}
