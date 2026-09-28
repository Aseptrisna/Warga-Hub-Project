import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schemas/payment.schema';
import { Citizen } from '../citizens/schemas/citizen.schema';
import { IuranType } from '../iuran-types/schemas/iuran-type.schema';
import { User } from '../users/schemas/user.schema';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentGatewayService } from '../payment-gateway/payment-gateway.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Citizen.name) private citizenModel: Model<Citizen>,
    @InjectModel(IuranType.name) private iuranTypeModel: Model<IuranType>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentGatewayService: PaymentGatewayService,
  ) {}

  /** Payment.citizenId references Citizen, not User - resolve the linked account. */
  private async getUserIdForCitizen(citizenId: string): Promise<string | null> {
    const user = await this.userModel.findOne({ citizenId }).select('_id').lean();
    return user ? String(user._id) : null;
  }

  async create(data: any, userId: string, userName: string) {
    const payment = new this.paymentModel({
      ...data,
      createdBy: userId,
      createdByName: userName,
      status: data.status || 'Belum Bayar',
    });
    await payment.save();

    this.auditService.log({
      userId,
      userName,
      action: 'CREATE',
      module: 'payments',
      entityId: payment._id,
      entityType: 'Payment',
      description: `Mencatat tagihan: ${data.citizenName || 'Warga'} - ${data.iuranTypeName} - Rp ${data.jumlah}`,
    });

    return { message: 'Tagihan berhasil dibuat', data: payment };
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, search, rt, rw, desa, status, bulan, tahun, iuranTypeId, citizenId } = query;
    const filter: any = {};

    if (citizenId) filter.citizenId = citizenId;
    if (search) filter.citizenName = { $regex: search, $options: 'i' };
    if (rt) filter.rt = rt;
    if (rw) filter.rw = rw;
    if (desa) filter.desa = desa;
    if (status) filter.status = status;
    if (bulan) filter.bulan = parseInt(bulan);
    if (tahun) filter.tahun = parseInt(tahun);
    if (iuranTypeId) filter.iuranTypeId = iuranTypeId;

    const total = await this.paymentModel.countDocuments(filter);
    const payments = await this.paymentModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data: payments,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  async getStatistics(filter?: any) {
    const matchFilter: any = {};
    if (filter?.citizenId) matchFilter.citizenId = filter.citizenId;
    if (filter?.desa) matchFilter.desa = filter.desa;
    if (filter?.rw) matchFilter.rw = filter.rw;
    if (filter?.rt) matchFilter.rt = filter.rt;
    if (filter?.bulan) matchFilter.bulan = parseInt(filter.bulan);
    if (filter?.tahun) matchFilter.tahun = parseInt(filter.tahun);

    const stats = await this.paymentModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalTagihan: { $sum: '$jumlah' },
          totalDibayar: { $sum: '$jumlahDibayar' },
          totalLunas: { $sum: { $cond: [{ $eq: ['$status', 'Lunas'] }, 1, 0] } },
          totalBelumBayar: { $sum: { $cond: [{ $eq: ['$status', 'Belum Bayar'] }, 1, 0] } },
          totalMenunggu: { $sum: { $cond: [{ $eq: ['$status', 'Menunggu Verifikasi'] }, 1, 0] } },
          totalDitolak: { $sum: { $cond: [{ $eq: ['$status', 'Ditolak'] }, 1, 0] } },
        },
      },
    ]);

    return stats[0] || { totalTagihan: 0, totalDibayar: 0, totalLunas: 0, totalBelumBayar: 0, totalMenunggu: 0, totalDitolak: 0 };
  }

  async findOne(id: string) {
    const payment = await this.paymentModel.findOne({ _id: id });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    return payment;
  }

  async update(id: string, data: any, user?: any) {
    const payment = await this.findOne(id);
    Object.assign(payment, data);
    await payment.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'UPDATE',
      module: 'payments',
      entityId: payment._id,
      entityType: 'Payment',
      description: `Memperbarui pembayaran: ${payment.citizenName || 'Warga'}`,
      changes: data,
    });

    return { message: 'Pembayaran berhasil diperbarui', data: payment };
  }

  /**
   * Upload bukti bayar - warga uploads proof, status changes to Menunggu Verifikasi
   */
  async uploadBukti(id: string, buktiBayarUrl: string, user?: any) {
    const payment = await this.findOne(id);

    if (payment.status !== 'Belum Bayar' && payment.status !== 'Ditolak') {
      throw new BadRequestException('Pembayaran sudah dibayar atau sedang menunggu verifikasi');
    }

    payment.buktiBayarUrl = buktiBayarUrl;
    payment.status = 'Menunggu Verifikasi';
    payment.tanggalBayar = new Date();
    payment.jumlahDibayar = payment.jumlah;
    await payment.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      action: 'UPDATE',
      module: 'payments',
      entityId: payment._id,
      entityType: 'Payment',
      description: `Upload bukti bayar: ${payment.citizenName} - ${payment.iuranTypeName}`,
    });

    return { message: 'Bukti pembayaran berhasil diupload', data: payment };
  }

  /**
   * Verify payment - admin approves or rejects
   */
  async verify(id: string, dto: { status: 'Lunas' | 'Ditolak'; rejectionReason?: string }, user: any) {
    const payment = await this.findOne(id);

    if (payment.status !== 'Menunggu Verifikasi') {
      throw new BadRequestException('Pembayaran tidak dalam status menunggu verifikasi');
    }

    payment.status = dto.status;
    payment.verifiedBy = user.id;
    payment.verifiedByName = user.name;
    payment.verifiedAt = new Date();

    if (dto.status === 'Ditolak') {
      payment.rejectionReason = dto.rejectionReason || '';
      payment.jumlahDibayar = 0;
    }

    await payment.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      module: 'payments',
      entityId: payment._id,
      entityType: 'Payment',
      description: `Verifikasi pembayaran ${dto.status}: ${payment.citizenName} - ${payment.iuranTypeName}`,
    });

    // Notify the citizen
    const notifyUserId = await this.getUserIdForCitizen(payment.citizenId);
    if (notifyUserId) this.notificationsService.create({
      userId: notifyUserId,
      title: dto.status === 'Lunas' ? 'Pembayaran Diverifikasi' : 'Pembayaran Ditolak',
      message: dto.status === 'Lunas'
        ? `Pembayaran ${payment.iuranTypeName} sebesar Rp ${payment.jumlah?.toLocaleString('id-ID')} telah diverifikasi lunas`
        : `Pembayaran ${payment.iuranTypeName} ditolak. Alasan: ${dto.rejectionReason || '-'}`,
      type: dto.status === 'Lunas' ? 'success' : 'error',
      sendEmail: true,
      module: 'payments',
      referenceId: payment._id,
      referenceUrl: `/finance`,
    }).catch((err) => this.logger.error('Failed to notify citizen of payment verification', err));

    return { message: `Pembayaran berhasil ${dto.status === 'Lunas' ? 'diverifikasi' : 'ditolak'}`, data: payment };
  }

  /**
   * Create a QRIS payment via PaymentGatewayService and return the hosted
   * payment link. The payment stays 'Belum Bayar' until the gateway's
   * webhook confirms completion (see handleGatewayWebhook) - no manual
   * admin verification needed for this path.
   */
  async createQrisPayment(id: string, user: any) {
    const payment = await this.findOne(id);

    if (user.role === Role.WARGA && payment.citizenId !== user.citizenId) {
      throw new BadRequestException('Tidak dapat membayar tagihan warga lain');
    }
    if (payment.status !== 'Belum Bayar' && payment.status !== 'Ditolak') {
      throw new BadRequestException('Pembayaran sudah dibayar atau sedang diproses');
    }

    const outstanding = payment.jumlah - (payment.jumlahDibayar || 0);
    if (outstanding <= 0) {
      throw new BadRequestException('Tidak ada tagihan yang perlu dibayar');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const gatewayPayment = await this.paymentGatewayService.createPayment({
      orderId: String(payment._id),
      amount: outstanding,
      successReturnUrl: `${frontendUrl}/finance?qris=success&paymentId=${payment._id}`,
      cancelReturnUrl: `${frontendUrl}/finance?qris=cancel&paymentId=${payment._id}`,
    });

    payment.qrisPaymentId = gatewayPayment.payment_id;
    payment.qrisPaymentLinkUrl = gatewayPayment.payment_link_url;
    payment.qrisStatus = gatewayPayment.status;
    payment.qrisFee = gatewayPayment.fee;
    payment.qrisNetAmount = gatewayPayment.net_amount;
    payment.qrisExpiresAt = new Date(gatewayPayment.expires_at);
    payment.metodeBayar = 'QRIS';
    await payment.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      action: 'UPDATE',
      module: 'payments',
      entityId: payment._id,
      entityType: 'Payment',
      description: `Membuat pembayaran QRIS: ${payment.citizenName} - ${payment.iuranTypeName}`,
    });

    return { message: 'Link pembayaran QRIS berhasil dibuat', data: payment };
  }

  /**
   * Poll fallback for QRIS status, used when a client suspects the webhook
   * was missed (see PaymentGatewayService INTEGRATION.md §3).
   */
  async getQrisStatus(id: string, user: any) {
    const payment = await this.findOne(id);
    if (user.role === Role.WARGA && payment.citizenId !== user.citizenId) {
      throw new BadRequestException('Tidak dapat melihat tagihan warga lain');
    }
    if (!payment.qrisPaymentId) {
      throw new BadRequestException('Pembayaran ini belum memiliki transaksi QRIS');
    }

    const gatewayPayment = await this.paymentGatewayService.getPayment(String(payment._id));
    if (gatewayPayment.status !== payment.qrisStatus) {
      await this.applyGatewayStatus(payment, gatewayPayment.status, gatewayPayment);
    }

    return { message: 'Status QRIS berhasil diambil', data: payment };
  }

  /**
   * Handles a signed webhook event relayed by PaymentGatewayService.
   * Caller (PaymentWebhookController) must have already verified the
   * HMAC signature before calling this.
   */
  async handleGatewayWebhook(payload: { event_type: string; data: any }) {
    const orderId = payload?.data?.order_id;
    if (!orderId) return { message: 'Ignored: missing order_id' };

    const payment = await this.paymentModel.findOne({ _id: orderId });
    if (!payment) {
      return { message: 'Ignored: unknown order_id' };
    }

    await this.applyGatewayStatus(payment, payload.data.status, payload.data);
    return { message: 'Webhook processed' };
  }

  private async applyGatewayStatus(payment: any, gatewayStatus: string, data: any) {
    payment.qrisStatus = gatewayStatus;
    if (data.fee !== undefined) payment.qrisFee = data.fee;
    if (data.net_amount !== undefined) payment.qrisNetAmount = data.net_amount;

    if (gatewayStatus === 'completed' && payment.status !== 'Lunas') {
      payment.status = 'Lunas';
      payment.jumlahDibayar = payment.jumlah;
      payment.tanggalBayar = new Date();
      payment.metodeBayar = 'QRIS';
      payment.verifiedBy = 'system';
      payment.verifiedByName = 'Payment Gateway (Otomatis)';
      payment.verifiedAt = new Date();

      const notifyUserId = await this.getUserIdForCitizen(payment.citizenId);
      if (notifyUserId) this.notificationsService.create({
        userId: notifyUserId,
        title: 'Pembayaran Berhasil',
        message: `Pembayaran QRIS ${payment.iuranTypeName} sebesar Rp ${payment.jumlah?.toLocaleString('id-ID')} telah diterima`,
        type: 'success',
        sendEmail: true,
        module: 'payments',
        referenceId: payment._id,
        referenceUrl: `/finance`,
      }).catch((err) => this.logger.error('Failed to notify citizen of QRIS payment completion', err));
    }

    await payment.save();

    this.auditService.log({
      userId: 'system',
      userName: 'Payment Gateway',
      action: 'UPDATE',
      module: 'payments',
      entityId: payment._id,
      entityType: 'Payment',
      description: `Update status QRIS (${gatewayStatus}): ${payment.citizenName} - ${payment.iuranTypeName}`,
    });
  }

  /**
   * Daily job: remind citizens about unpaid iuran that's either overdue
   * (from a previous bulan/tahun) or due soon (within the last 3 days of
   * the current month). Each payment is reminded at most once every 3
   * days (tracked via lastReminderSentAt) to avoid spamming.
   */
  @Cron('0 8 * * *', { timeZone: 'Asia/Jakarta' })
  async sendDueReminders() {
    const result = await this.runDueReminders();
    this.logger.log(`Iuran reminders: ${result.remindersSent} sent, ${result.skipped} skipped (no linked user)`);
    return result;
  }

  async runDueReminders(): Promise<{ remindersSent: number; skipped: number }> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const isNearMonthEnd = now.getDate() >= daysInMonth - 3;
    const reminderCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const candidates = await this.paymentModel.find({
      status: 'Belum Bayar',
      $or: [{ lastReminderSentAt: { $exists: false } }, { lastReminderSentAt: { $lte: reminderCutoff } }],
    });

    let remindersSent = 0;
    let skipped = 0;

    for (const payment of candidates) {
      const isOverdue = payment.tahun < currentYear || (payment.tahun === currentYear && payment.bulan < currentMonth);
      const isDueSoon = payment.tahun === currentYear && payment.bulan === currentMonth && isNearMonthEnd;
      if (!isOverdue && !isDueSoon) continue;

      const notifyUserId = await this.getUserIdForCitizen(payment.citizenId);
      if (!notifyUserId) {
        skipped++;
        continue;
      }

      const amount = (payment.jumlah - (payment.jumlahDibayar || 0)).toLocaleString('id-ID');
      await this.notificationsService.create({
        userId: notifyUserId,
        title: isOverdue ? 'Iuran Terlambat' : 'Pengingat Jatuh Tempo Iuran',
        message: isOverdue
          ? `Iuran ${payment.iuranTypeName} bulan ${payment.bulan}/${payment.tahun} sebesar Rp ${amount} belum dibayar. Mohon segera dilunasi.`
          : `Iuran ${payment.iuranTypeName} bulan ${payment.bulan}/${payment.tahun} sebesar Rp ${amount} akan jatuh tempo akhir bulan ini.`,
        type: 'warning',
        sendEmail: true,
        module: 'payments',
        referenceId: payment._id,
        referenceUrl: `/finance`,
      });

      payment.lastReminderSentAt = now;
      await payment.save();
      remindersSent++;
    }

    return { remindersSent, skipped };
  }

  /**
   * Get payment matrix: citizens x iuran types for a given month/year
   */
  async getMatrix(query: any) {
    const { bulan, tahun, desa, rw, rt } = query;

    if (!bulan || !tahun) {
      throw new BadRequestException('Bulan dan tahun harus diisi');
    }

    const monthNum = parseInt(bulan);
    const yearNum = parseInt(tahun);

    // 1. Get citizens in scope
    const citizenFilter: any = {};
    if (desa) citizenFilter.desa = desa;
    if (rw) citizenFilter.rw = rw;
    if (rt) citizenFilter.rt = rt;

    const citizens: any[] = await this.citizenModel
      .find(citizenFilter)
      .select('_id namaLengkap nik rt rw desa')
      .sort({ namaLengkap: 1 })
      .lean()
      .exec();

    // 2. Get applicable iuran types
    const iuranConditions: any[] = [];
    if (desa) iuranConditions.push({ desa, scopeLevel: 'desa', isActive: true });
    if (desa && rw) iuranConditions.push({ desa, rw, scopeLevel: 'rw', isActive: true });
    if (desa && rw && rt) iuranConditions.push({ desa, rw, rt, scopeLevel: 'rt', isActive: true });

    const iuranTypes: any[] = iuranConditions.length > 0
      ? await this.iuranTypeModel.find({ $or: iuranConditions }).sort({ nama: 1 }).lean().exec()
      : [];

    // 3. Get payments for this month/year
    const paymentFilter: any = { bulan: monthNum, tahun: yearNum };
    if (desa) paymentFilter.desa = desa;
    if (rw) paymentFilter.rw = rw;
    if (rt) paymentFilter.rt = rt;

    const payments: any[] = await this.paymentModel.find(paymentFilter).lean().exec();

    // 4. Build map: citizenId-iuranTypeId -> payment
    const paymentMap = new Map<string, any>();
    for (const p of payments) {
      paymentMap.set(`${p.citizenId}-${p.iuranTypeId}`, p);
    }

    // 5. Build matrix rows
    const rows = citizens.map((c) => {
      const cells: any[] = iuranTypes.map((it) => {
        const key = `${c._id}-${it._id}`;
        const payment = paymentMap.get(key);
        return {
          iuranTypeId: it._id,
          iuranTypeName: it.nama,
          jumlah: it.jumlah,
          status: payment?.status || null,
          paymentId: payment?._id || null,
          buktiBayarUrl: payment?.buktiBayarUrl || null,
        };
      });

      return {
        citizenId: c._id,
        citizenName: c.namaLengkap,
        nik: c.nik,
        rt: c.rt,
        rw: c.rw,
        cells,
      };
    });

    // 6. Summary
    const summary = {
      totalWarga: citizens.length,
      totalIuranTypes: iuranTypes.length,
      totalTagihan: citizens.length * iuranTypes.length,
      lunas: 0,
      menunggu: 0,
      belumBayar: 0,
      ditolak: 0,
    };

    for (const row of rows) {
      for (const cell of row.cells) {
        if (cell.status === 'Lunas') summary.lunas++;
        else if (cell.status === 'Menunggu Verifikasi') summary.menunggu++;
        else if (cell.status === 'Ditolak') summary.ditolak++;
        else summary.belumBayar++;
      }
    }

    return {
      bulan: monthNum,
      tahun: yearNum,
      iuranTypes: iuranTypes.map((it) => ({
        id: it._id,
        nama: it.nama,
        jumlah: it.jumlah,
      })),
      rows,
      summary,
    };
  }

  /**
   * Generate bulk payment records for all citizens x active iuran types
   */
  async generateBulk(query: { bulan: number; tahun: number; desa?: string; rw?: string; rt?: string }, user: any) {
    const { bulan, tahun, desa, rw, rt } = query;

    // Get citizens in scope
    const citizenFilter: any = {};
    if (desa) citizenFilter.desa = desa;
    if (rw) citizenFilter.rw = rw;
    if (rt) citizenFilter.rt = rt;

    const citizens: any[] = await this.citizenModel.find(citizenFilter).lean().exec();

    // Get applicable iuran types
    const iuranConditions: any[] = [];
    if (desa) iuranConditions.push({ desa, scopeLevel: 'desa', isActive: true });
    if (desa && rw) iuranConditions.push({ desa, rw, scopeLevel: 'rw', isActive: true });
    if (desa && rw && rt) iuranConditions.push({ desa, rw, rt, scopeLevel: 'rt', isActive: true });

    const iuranTypes: any[] = iuranConditions.length > 0
      ? await this.iuranTypeModel.find({ $or: iuranConditions }).lean().exec()
      : [];

    if (iuranTypes.length === 0) {
      throw new BadRequestException('Belum ada jenis iuran yang aktif');
    }

    // Batch-fetch existing payments for this bulan/tahun scoped to these
    // citizens, instead of one findOne per citizen x iuranType pair.
    const citizenIds = citizens.map((c) => c._id);
    const existingPayments: any[] = await this.paymentModel
      .find({ citizenId: { $in: citizenIds }, bulan, tahun })
      .select('citizenId iuranTypeId')
      .lean()
      .exec();
    const existingKeys = new Set(existingPayments.map((p) => `${p.citizenId}:${p.iuranTypeId}`));

    let skipped = 0;
    const toInsert: any[] = [];

    for (const c of citizens) {
      for (const it of iuranTypes) {
        // Check if this citizen is within the iuran type scope
        if (it.scopeLevel === 'rw' && c.rw !== it.rw) continue;
        if (it.scopeLevel === 'rt' && (c.rw !== it.rw || c.rt !== it.rt)) continue;

        if (existingKeys.has(`${c._id}:${it._id}`)) {
          skipped++;
          continue;
        }

        toInsert.push({
          citizenId: c._id,
          citizenName: c.namaLengkap,
          nik: c.nik,
          rt: c.rt,
          rw: c.rw,
          desa: c.desa,
          iuranTypeId: it._id,
          iuranTypeName: it.nama,
          jumlah: it.jumlah,
          bulan,
          tahun,
          status: 'Belum Bayar',
          jumlahDibayar: 0,
          createdBy: user.id,
          createdByName: user.name,
        });
      }
    }

    if (toInsert.length > 0) {
      await this.paymentModel.insertMany(toInsert);
    }
    const created = toInsert.length;

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE',
      module: 'payments',
      entityType: 'Payment',
      description: `Generate tagihan bulk: ${created} tagihan dibuat, ${skipped} sudah ada (${bulan}/${tahun})`,
    });

    return {
      message: `Berhasil generate ${created} tagihan (${skipped} sudah ada)`,
      created,
      skipped,
    };
  }

  async remove(id: string, user?: any) {
    const payment = await this.paymentModel.findOne({ _id: id });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    await this.paymentModel.deleteOne({ _id: id });

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'DELETE',
      module: 'payments',
      entityId: id,
      entityType: 'Payment',
      description: `Menghapus pembayaran: ${payment.citizenName || 'Warga'}`,
    });

    return { message: 'Pembayaran berhasil dihapus' };
  }
}
