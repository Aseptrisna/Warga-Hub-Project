import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UmkmService } from './umkm.service';
import { UmkmController, UmkmPublicController } from './umkm.controller';
import { Umkm, UmkmSchema } from './schemas/umkm.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Umkm.name, schema: UmkmSchema }])],
  // Public controller first so GET /umkm/public isn't captured by GET /umkm/:id
  controllers: [UmkmPublicController, UmkmController],
  providers: [UmkmService],
})
export class UmkmModule {}
