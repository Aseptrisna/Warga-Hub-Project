import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportStatus } from './schemas/report.schema';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(data: any, userId: string, userName: string) {
    const report = new this.reportModel({
      ...data,
      pelaporId: userId,
      pelaporName: userName,
      status: ReportStatus.PENDING,
    });
    await report.save();

    this.auditService.log({
      userId,
      userName,
      action: 'CREATE',
      module: 'reports',
      entityId: report._id,
      entityType: 'Report',
      description: `Membuat laporan: ${data.judul}`,
    });

    // Notify KetuaRT & AdminRT about new report
    this.notificationsService.notifyByRole(
      ['KetuaRT', 'AdminRT'],
      {
        title: 'Laporan Baru',
        message: `${userName} melaporkan: ${data.judul}`,
        type: 'warning',
        module: 'reports',
        referenceId: report._id,
        referenceUrl: `/reports/${report._id}`,
      },
    ).catch((err) => this.logger.error('Failed to notify RT of new report', err));

    return { message: 'Laporan berhasil dibuat', data: report };
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, search, kategori, status, desa, rw, rt, pelaporId } = query || {};
    const filter: any = {};

    if (pelaporId) filter.pelaporId = pelaporId;
    if (search) {
      filter.$or = [
        { judul: { $regex: search, $options: 'i' } },
        { deskripsi: { $regex: search, $options: 'i' } },
      ];
    }
    if (kategori) filter.kategori = kategori;
    if (status) filter.status = status;
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;

    const total = await this.reportModel.countDocuments(filter);
    const reports = await this.reportModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data: reports,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const report = await this.reportModel.findOne({ _id: id });
    if (!report) throw new NotFoundException('Laporan tidak ditemukan');
    return report;
  }

  async updateStatus(id: string, status: string, tanggapan: string, userId: string, userName: string) {
    const report = await this.findOne(id);
    report.status = status;
    report.tanggapan = tanggapan;
    report.respondedBy = userId;
    report.respondedByName = userName;
    report.respondedAt = new Date();
    await report.save();

    this.auditService.log({
      userId,
      userName,
      action: 'UPDATE',
      module: 'reports',
      entityId: report._id,
      entityType: 'Report',
      description: `Merespons laporan: ${report.judul} (Status: ${status})`,
      changes: { status, tanggapan },
    });

    // Notify the reporter about the response
    if (report.pelaporId) {
      this.notificationsService.create({
        userId: report.pelaporId,
        title: 'Laporan Direspons',
        message: `Laporan "${report.judul}" telah direspons: ${tanggapan}`,
        type: 'info',
        module: 'reports',
        referenceId: report._id,
        referenceUrl: `/reports/${report._id}`,
      }).catch((err) => this.logger.error('Failed to notify reporter of report response', err));
    }

    return { message: 'Status laporan diperbarui', data: report };
  }

  async getStatistics(filter?: any) {
    const match: any = {};
    if (filter?.desa) match.desa = filter.desa;

    const [total, pending, inProgress, resolved] = await Promise.all([
      this.reportModel.countDocuments(match),
      this.reportModel.countDocuments({ ...match, status: ReportStatus.PENDING }),
      this.reportModel.countDocuments({ ...match, status: ReportStatus.IN_PROGRESS }),
      this.reportModel.countDocuments({ ...match, status: ReportStatus.RESOLVED }),
    ]);

    const byCategory = await this.reportModel.aggregate([
      { $match: match },
      { $group: { _id: '$kategori', count: { $sum: 1 } } },
    ]);

    return { total, pending, inProgress, resolved, byCategory };
  }

  async remove(id: string) {
    const report = await this.reportModel.findOne({ _id: id });
    if (!report) throw new NotFoundException('Laporan tidak ditemukan');
    await this.reportModel.deleteOne({ _id: id });
    return { message: 'Laporan berhasil dihapus' };
  }
}
