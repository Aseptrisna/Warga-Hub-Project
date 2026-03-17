import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { Family, FamilySchema } from './schemas/family.schema';
import { Citizen, CitizenSchema } from '../citizens/schemas/citizen.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Family.name, schema: FamilySchema },
      { name: Citizen.name, schema: CitizenSchema },
    ]),
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService, MongooseModule],
})
export class FamiliesModule {}
