import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PanicAlert, PanicStatus } from './schemas/panic-alert.schema';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PanicService {
  private readonly logger = new Logger(PanicService.name);

  constructor(
    @InjectModel(PanicAlert.name) private panicModel: Model<PanicAlert>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(data: any, user: any) {
    const alert = new this.panicModel({
      ...data,
      pelaporId: user.id,
      pelaporName: user.name,
      desa: user.desa,
      rw: user.rw,
      rt: user.rt,
      status: PanicStatus.ACTIVE,
    });
    await alert.save();

    const userId = user.id;
    const userName = user.name;
    this.auditService.log({
      userId,
      userName,
      action: 'CREATE',
      module: 'panic',
      entityId: alert._id,
      entityType: 'PanicAlert',
      description: `Panic alert dipicu oleh ${userName}: ${data.tipeEmergency || 'Darurat'}`,
    });

    // Notify KetuaRT & PetugasRonda about panic alert
    this.notificationsService.notifyByRole(
      ['KetuaRT', 'PetugasRonda'],
      {
        title: 'PANIC ALERT!',
        message: `${userName} memicu tombol darurat: ${data.tipeEmergency || 'Darurat'}`,
        type: 'error',
        module: 'panic',
        referenceId: alert._id,
        referenceUrl: `/panic/${alert._id}`,
      },
    ).catch((err) => this.logger.error('Failed to notify RT/petugas ronda of panic alert', err));

    return { message: 'PANIC ALERT terkirim!', data: alert };
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, status, desa, rw, rt, pelaporId } = query || {};
    const filter: any = {};

    if (pelaporId) filter.pelaporId = pelaporId;
    if (status) filter.status = status;
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;

    const total = await this.panicModel.countDocuments(filter);
    const alerts = await this.panicModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data: alerts,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  async getActive(filter?: any) {
    const match: any = { status: PanicStatus.ACTIVE };
    if (filter?.desa) match.desa = filter.desa;
    if (filter?.rw) match.rw = filter.rw;
    if (filter?.rt) match.rt = filter.rt;

    const alerts = await this.panicModel.find(match).sort({ createdAt: -1 }).limit(200);
    return { data: alerts, total: alerts.length };
  }

  async findOne(id: string) {
    const alert = await this.panicModel.findOne({ _id: id });
    if (!alert) throw new NotFoundException('Alert tidak ditemukan');
    return alert;
  }

  async respond(id: string, userId: string, userName: string, tindakan: string) {
    const alert = await this.findOne(id);
    alert.status = PanicStatus.RESPONDED;
    alert.respondedBy = userId;
    alert.respondedByName = userName;
    alert.respondedAt = new Date();
    alert.tindakan = tindakan;
    await alert.save();
    return { message: 'Alert telah direspons', data: alert };
  }

  async resolve(id: string, tindakan?: string) {
    const alert = await this.findOne(id);
    alert.status = PanicStatus.RESOLVED;
    if (tindakan) alert.tindakan = tindakan;
    alert.resolvedAt = new Date();
    await alert.save();
    return { message: 'Alert telah diselesaikan', data: alert };
  }

  async getStatistics(filter?: any) {
    const match: any = {};
    if (filter?.desa) match.desa = filter.desa;

    const [total, active, responded, resolved] = await Promise.all([
      this.panicModel.countDocuments(match),
      this.panicModel.countDocuments({ ...match, status: PanicStatus.ACTIVE }),
      this.panicModel.countDocuments({ ...match, status: PanicStatus.RESPONDED }),
      this.panicModel.countDocuments({ ...match, status: PanicStatus.RESOLVED }),
    ]);

    const byType = await this.panicModel.aggregate([
      { $match: match },
      { $group: { _id: '$tipeEmergency', count: { $sum: 1 } } },
    ]);

    return { total, active, responded, resolved, byType };
  }
}
