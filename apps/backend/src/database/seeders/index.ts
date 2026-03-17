import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Schema imports
import { UserSchema } from '../../modules/users/schemas/user.schema';
import { RegionSchema } from '../../modules/regions/schemas/region.schema';
import { CitizenSchema } from '../../modules/citizens/schemas/citizen.schema';
import { FamilySchema } from '../../modules/families/schemas/family.schema';
import { IuranTypeSchema } from '../../modules/iuran-types/schemas/iuran-type.schema';
import { PaymentSchema } from '../../modules/payments/schemas/payment.schema';
import { LetterTemplateSchema } from '../../modules/letter-templates/schemas/letter-template.schema';
import { LetterSchema } from '../../modules/letters/schemas/letter.schema';
import { AnnouncementSchema } from '../../modules/announcements/schemas/announcement.schema';
import { PatrolCheckpointSchema } from '../../modules/patrol/schemas/patrol-checkpoint.schema';
import { PatrolScheduleSchema } from '../../modules/patrol/schemas/patrol-schedule.schema';
import { PatrolLogSchema } from '../../modules/patrol/schemas/patrol-log.schema';
import { ExpenseSchema } from '../../modules/expenses/schemas/expense.schema';
import { GuestbookEntrySchema } from '../../modules/guestbook/schemas/guestbook-entry.schema';
import { EventSchema } from '../../modules/events/schemas/event.schema';
import { ReportSchema } from '../../modules/reports/schemas/report.schema';
import { PanicAlertSchema } from '../../modules/panic/schemas/panic-alert.schema';
import { NotificationSchema } from '../../modules/notifications/schemas/notification.schema';
import { AuditLogSchema } from '../../modules/audit/schemas/audit-log.schema';
import { SettingSchema } from '../../modules/settings/schemas/setting.schema';

// Seeder imports
import { seedRegions } from './regions.seeder';
import { seedUsers } from './users.seeder';
import { seedCitizensComprehensive } from './citizens-comprehensive.seeder';
import { seedFamilies } from './families.seeder';
import { seedIuranTypes } from './iuran-types.seeder';
import { seedPayments } from './payments.seeder';
import { seedLetterTemplates } from './letter-templates.seeder';
import { seedLetters } from './letters.seeder';
import { seedAnnouncements } from './announcements.seeder';
import { seedPatrolCheckpoints } from './patrol-checkpoints.seeder';
import { seedPatrolSchedules } from './patrol-schedules.seeder';
import { seedPatrolLogs } from './patrol-logs.seeder';
import { seedExpenses } from './expenses.seeder';
import { seedGuestbook } from './guestbook.seeder';
import { seedEvents } from './events.seeder';
import { seedReports } from './reports.seeder';
import { seedPanicAlerts } from './panic-alerts.seeder';
import { seedNotifications } from './notifications.seeder';
import { seedAuditLogs } from './audit-logs.seeder';
import { seedSettings } from './settings.seeder';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wargahub';

async function runSeeders() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Register all models
    const RegionModel = mongoose.model('Region', RegionSchema);
    const UserModel = mongoose.model('User', UserSchema);
    const CitizenModel = mongoose.model('Citizen', CitizenSchema);
    const FamilyModel = mongoose.model('Family', FamilySchema);
    const IuranTypeModel = mongoose.model('IuranType', IuranTypeSchema);
    const PaymentModel = mongoose.model('Payment', PaymentSchema);
    const LetterTemplateModel = mongoose.model('LetterTemplate', LetterTemplateSchema);
    const LetterModel = mongoose.model('Letter', LetterSchema);
    const AnnouncementModel = mongoose.model('Announcement', AnnouncementSchema);
    const PatrolCheckpointModel = mongoose.model('PatrolCheckpoint', PatrolCheckpointSchema);
    const PatrolScheduleModel = mongoose.model('PatrolSchedule', PatrolScheduleSchema);
    const PatrolLogModel = mongoose.model('PatrolLog', PatrolLogSchema);
    const ExpenseModel = mongoose.model('Expense', ExpenseSchema);
    const GuestbookModel = mongoose.model('GuestbookEntry', GuestbookEntrySchema);
    const EventModel = mongoose.model('Event', EventSchema);
    const ReportModel = mongoose.model('Report', ReportSchema);
    const PanicAlertModel = mongoose.model('PanicAlert', PanicAlertSchema);
    const NotificationModel = mongoose.model('Notification', NotificationSchema);
    const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);
    const SettingModel = mongoose.model('Setting', SettingSchema);

    // ============================
    // Run seeders in dependency order
    // ============================

    // 1. Regions (foundation)
    const regionIds = await seedRegions(RegionModel);

    // 2. Users (depends on regions for scope)
    await seedUsers(UserModel);

    // 3. Citizens (500 warga)
    await seedCitizensComprehensive(CitizenModel);

    // 3b. Link warga user to citizen record
    // Use updateOne to avoid triggering pre-save hook (which would re-hash password)
    console.log('🔗 Linking warga user to citizen record...');
    const wargaUser = await UserModel.findOne({ email: 'warga@wargahub.id' });
    if (wargaUser && !wargaUser.citizenId) {
      const matchedCitizen = await CitizenModel.findOne({
        rt: '01',
        rw: '01',
        statusHubunganDalamKeluarga: 'Kepala Keluarga',
        userId: { $exists: false },
      });
      if (matchedCitizen) {
        await UserModel.updateOne(
          { _id: wargaUser._id },
          { $set: { citizenId: matchedCitizen._id, nik: matchedCitizen.nik, name: matchedCitizen.namaLengkap } },
        );
        await CitizenModel.updateOne(
          { _id: matchedCitizen._id },
          { $set: { userId: wargaUser._id } },
        );
        console.log(`✅ Linked warga user to citizen: ${matchedCitizen.namaLengkap} (NIK: ${matchedCitizen.nik})`);
      } else {
        console.log('⚠️  No unlinked citizen found in RT 01 / RW 01');
      }
    } else if (wargaUser?.citizenId) {
      console.log('⏭️  Warga user already linked to citizen');
    }

    // 4. Families (derived from citizens)
    await seedFamilies(FamilyModel, CitizenModel);

    // 5. Iuran Types
    await seedIuranTypes(IuranTypeModel, UserModel);

    // 6. Payments (depends on citizens + iuran types)
    await seedPayments(PaymentModel, CitizenModel, UserModel, IuranTypeModel);

    // 7. Letter Templates
    await seedLetterTemplates(LetterTemplateModel);

    // 8. Letters (depends on templates + users + citizens)
    await seedLetters(LetterModel, LetterTemplateModel, UserModel, CitizenModel);

    // 9. Announcements
    await seedAnnouncements(AnnouncementModel, UserModel);

    // 10. Patrol Checkpoints
    const checkpoints = await seedPatrolCheckpoints(PatrolCheckpointModel, RegionModel);

    // 11. Patrol Schedules
    const schedules = await seedPatrolSchedules(PatrolScheduleModel, UserModel, RegionModel, checkpoints);

    // 12. Patrol Logs
    await seedPatrolLogs(PatrolLogModel, UserModel, schedules, checkpoints);

    // 13. Expenses
    await seedExpenses(ExpenseModel, UserModel);

    // 14. Guestbook
    await seedGuestbook(GuestbookModel);

    // 15. Events
    await seedEvents(EventModel, UserModel);

    // 16. Reports
    await seedReports(ReportModel, UserModel);

    // 17. Panic Alerts
    await seedPanicAlerts(PanicAlertModel, UserModel);

    // 18. Notifications
    await seedNotifications(NotificationModel, UserModel);

    // 19. Audit Logs
    await seedAuditLogs(AuditLogModel, UserModel);

    // 20. Settings
    await seedSettings(SettingModel);

    // ============================
    // Summary
    // ============================
    console.log('\n🎉 All seeders completed successfully!');
    console.log('\n📋 Default Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SuperAdmin      : superadmin@wargahub.id / Admin123!');
    console.log('Admin Platform  : admin@wargahub.id / Admin123!');
    console.log('Admin Desa      : admindesa@wargahub.id / Admin123!');
    console.log('Kepala Desa     : kepaladesa@wargahub.id / Admin123!');
    console.log('Sekretaris Desa : sekdes@wargahub.id / Admin123!');
    console.log('Kaur Keuangan   : kaurkeuangan@wargahub.id / Admin123!');
    console.log('Ketua RW 01-04  : ketuarw01-04@wargahub.id / Admin123!');
    console.log('Ketua RT 01-12  : ketuart01-12@wargahub.id / Admin123!');
    console.log('Petugas Ronda   : ronda01-04@wargahub.id / Admin123!');
    console.log('Warga           : warga@wargahub.id / Warga123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📊 Sample Data Created:');
    console.log('  - 20 Regions (1 Provinsi + 1 Kabupaten + 1 Kecamatan + 1 Desa + 4 RW + 12 RT)');
    console.log('  - ~47 Users (semua role)');
    console.log('  - 500 Citizens dari ~125 keluarga');
    console.log('  - Family (KK) records dari citizen data');
    console.log('  - 4 Iuran Types (Kebersihan, Keamanan, RT, Sosial)');
    console.log('  - ~250 Payment records (3 bulan terakhir)');
    console.log('  - 4 Letter Templates (SKD, SKTM, SKU, SKCK)');
    console.log('  - 15 Sample Letters (berbagai status)');
    console.log('  - 8 Announcements (Umum, Penting, Mendesak)');
    console.log('  - 16 Patrol Checkpoints (12 per RT + 4 area umum)');
    console.log('  - 12 Patrol Schedules (completed, in-progress, scheduled)');
    console.log('  - ~20 Patrol Logs (valid + invalid scans)');
    console.log('  - 15 Expense records (approved, pending, rejected)');
    console.log('  - 10 Guestbook entries (masuk, keluar)');
    console.log('  - 8 Events (upcoming, ongoing, completed, cancelled)');
    console.log('  - 10 Reports (pending, in_progress, resolved, rejected)');
    console.log('  - 5 Panic Alerts (active, responded, resolved)');
    console.log('  - 15 Notifications (info, warning, success, error)');
    console.log('  - 20 Audit Logs (LOGIN, CREATE, UPDATE, APPROVE, REJECT, etc.)');
    console.log('  - 10 Settings (general, appearance, notification, security)\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runSeeders();
