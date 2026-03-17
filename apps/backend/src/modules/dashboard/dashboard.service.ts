import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Citizen } from '../citizens/schemas/citizen.schema';
import { Family } from '../families/schemas/family.schema';
import { Payment } from '../payments/schemas/payment.schema';
import { Expense } from '../expenses/schemas/expense.schema';
import { Letter } from '../letters/schemas/letter.schema';
import { Report } from '../reports/schemas/report.schema';
import { Event } from '../events/schemas/event.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Citizen.name) private citizenModel: Model<Citizen>,
    @InjectModel(Family.name) private familyModel: Model<Family>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(Letter.name) private letterModel: Model<Letter>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
  ) {}

  async getSummary(regionScope: Record<string, string> = {}) {
    const hasScope = Object.keys(regionScope).length > 0;
    const citizenMatch: any = { isActive: true, ...regionScope };
    const familyMatch: any = { isActive: true, ...regionScope };
    const paymentMatch: any = { ...regionScope };
    const expenseMatch: any = { status: 'Approved', ...regionScope };
    const reportMatch: any = { ...regionScope };
    const eventMatch: any = { ...regionScope };

    // Letters don't have desa/rw/rt fields - need citizen-based lookup
    let letterMatch: any = {};
    if (hasScope) {
      const scopedCitizens = await this.citizenModel
        .find(regionScope)
        .select('_id')
        .lean();
      const citizenIds = scopedCitizens.map((c: any) => c._id);
      letterMatch = { citizenId: { $in: citizenIds } };
    }

    const [
      totalWarga,
      totalKeluarga,
      paymentStats,
      expenseStats,
      letterStats,
      reportStats,
      eventStats,
      genderStats,
    ] = await Promise.all([
      this.citizenModel.countDocuments(citizenMatch),
      this.familyModel.countDocuments(familyMatch),
      this.paymentModel.aggregate([
        { $match: paymentMatch },
        {
          $group: {
            _id: null,
            totalTagihan: { $sum: 1 },
            lunas: { $sum: { $cond: [{ $eq: ['$status', 'Lunas'] }, 1, 0] } },
            totalNominal: { $sum: '$jumlah' },
            totalLunas: { $sum: { $cond: [{ $eq: ['$status', 'Lunas'] }, '$jumlah', 0] } },
          },
        },
      ]),
      this.expenseModel.aggregate([
        { $match: expenseMatch },
        { $group: { _id: null, total: { $sum: '$jumlah' } } },
      ]),
      this.letterModel.aggregate([
        { $match: letterMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $in: ['$status', ['pending_rt', 'pending_rw', 'approved_rt', 'approved_rw']] }, 1, 0] } },
          },
        },
      ]),
      this.reportModel.aggregate([
        { $match: reportMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          },
        },
      ]),
      this.eventModel.countDocuments(eventMatch),
      this.citizenModel.aggregate([
        { $match: citizenMatch },
        {
          $group: {
            _id: '$jenisKelamin',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const payment = paymentStats[0] || { totalTagihan: 0, lunas: 0, totalNominal: 0, totalLunas: 0 };
    const expense = expenseStats[0] || { total: 0 };
    const letter = letterStats[0] || { total: 0, pending: 0 };
    const report = reportStats[0] || { total: 0, pending: 0 };

    return {
      totalWarga,
      totalKeluarga,
      tagihanLunas: payment.lunas,
      totalTagihan: payment.totalTagihan,
      totalPemasukan: payment.totalLunas,
      totalPengeluaran: expense.total,
      suratTotal: letter.total,
      suratPending: letter.pending,
      laporanTotal: report.total,
      laporanPending: report.pending,
      totalEvent: eventStats,
      gender: genderStats.reduce((acc: any, g: any) => {
        acc[g._id] = g.count;
        return acc;
      }, {}),
    };
  }

  async getChartData(period: string = 'monthly', regionScope: Record<string, string> = {}) {
    const now = new Date();
    let startDate: Date;
    let groupFormat: string;

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 7 * 24 * 60 * 60 * 1000); // Last 7 weeks
      groupFormat = '%Y-W%V';
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      groupFormat = '%Y-%m';
    } else {
      // monthly - last 6 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      groupFormat = '%Y-%m';
    }

    // Income trend (payments)
    const incomeTrend = await this.paymentModel.aggregate([
      { $match: { status: 'Lunas', createdAt: { $gte: startDate }, ...regionScope } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          total: { $sum: '$jumlah' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Expense trend
    const expenseTrend = await this.expenseModel.aggregate([
      { $match: { status: 'Approved', tanggalPengeluaran: { $gte: startDate }, ...regionScope } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$tanggalPengeluaran' } },
          total: { $sum: '$jumlah' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Report by category
    const reportByCategory = await this.reportModel.aggregate([
      { $match: { ...regionScope } },
      {
        $group: {
          _id: '$kategori',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Expense by category
    const expenseByCategory = await this.expenseModel.aggregate([
      { $match: { status: 'Approved', ...regionScope } },
      {
        $group: {
          _id: '$kategori',
          total: { $sum: '$jumlah' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return {
      incomeTrend,
      expenseTrend,
      reportByCategory,
      expenseByCategory,
    };
  }
}
