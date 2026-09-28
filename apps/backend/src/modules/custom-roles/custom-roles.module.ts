import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomRolesService } from './custom-roles.service';
import { CustomRolesController } from './custom-roles.controller';
import { CustomRole, CustomRoleSchema } from './schemas/custom-role.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuditModule } from '../audit/audit.module';

/**
 * Global: CustomRolesService must be resolvable by RolesGuard, which is
 * instantiated ad-hoc via @UseGuards() in ~19 other feature modules that
 * don't (and shouldn't need to) import this module explicitly.
 */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomRole.name, schema: CustomRoleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuditModule,
  ],
  controllers: [CustomRolesController],
  providers: [CustomRolesService],
  exports: [CustomRolesService],
})
export class CustomRolesModule {}
