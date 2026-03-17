import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IuranTypesService } from './iuran-types.service';
import { IuranTypesController } from './iuran-types.controller';
import { IuranType, IuranTypeSchema } from './schemas/iuran-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: IuranType.name, schema: IuranTypeSchema }]),
  ],
  controllers: [IuranTypesController],
  providers: [IuranTypesService],
  exports: [IuranTypesService, MongooseModule],
})
export class IuranTypesModule {}
