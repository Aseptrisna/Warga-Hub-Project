import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Citizen, CitizenSchema } from '../citizens/schemas/citizen.schema';
import { Region, RegionSchema } from '../regions/schemas/region.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Citizen.name, schema: CitizenSchema },
      { name: Region.name, schema: RegionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
