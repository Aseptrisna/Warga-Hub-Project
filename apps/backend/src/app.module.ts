import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './common/services/email.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RegionsModule } from './modules/regions/regions.module';
import { CitizensModule } from './modules/citizens/citizens.module';
import { LetterTemplatesModule } from './modules/letter-templates/letter-templates.module';
import { LettersModule } from './modules/letters/letters.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PatrolModule } from './modules/patrol/patrol.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EventsModule } from './modules/events/events.module';
import { PanicModule } from './modules/panic/panic.module';
import { FamiliesModule } from './modules/families/families.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { GuestbookModule } from './modules/guestbook/guestbook.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { IuranTypesModule } from './modules/iuran-types/iuran-types.module';
import { CustomRolesModule } from './modules/custom-roles/custom-roles.module';
import { UmkmModule } from './modules/umkm/umkm.module';
import { KicauModule } from './modules/kicau/kicau.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/wargahub', {
      autoCreate: true,
      autoIndex: true,
    }),

    // Cron jobs (e.g. iuran due-date reminders)
    ScheduleModule.forRoot(),
    EmailModule,

    // Feature modules
    CustomRolesModule,
    AuthModule,
    UsersModule,
    RegionsModule,
    CitizensModule,
    FamiliesModule,
    LetterTemplatesModule,
    LettersModule,
    AnnouncementsModule,
    PaymentsModule,
    PatrolModule,
    SettingsModule,
    ReportsModule,
    EventsModule,
    PanicModule,
    ExpensesModule,
    GuestbookModule,
    DashboardModule,
    NotificationsModule,
    AuditModule,
    IuranTypesModule,
    UmkmModule,
    KicauModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
