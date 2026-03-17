import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Citizen, CitizenSchema } from '../citizens/schemas/citizen.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Citizen.name, schema: CitizenSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [MongooseModule, UsersService],
})
export class UsersModule {}
