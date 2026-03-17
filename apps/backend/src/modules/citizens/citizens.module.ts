import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensService } from './citizens.service';
import { CitizensController } from './citizens.controller';
import { Citizen, CitizenSchema } from './schemas/citizen.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Citizen.name, schema: CitizenSchema }]),
  ],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService, MongooseModule],
})
export class CitizensModule {}
