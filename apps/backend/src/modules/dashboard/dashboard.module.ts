import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Citizen, CitizenSchema } from '../citizens/schemas/citizen.schema';
import { Family, FamilySchema } from '../families/schemas/family.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { Letter, LetterSchema } from '../letters/schemas/letter.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Citizen.name, schema: CitizenSchema },
      { name: Family.name, schema: FamilySchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Letter.name, schema: LetterSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
