import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schemas/payment.schema';
import { Citizen } from '../citizens/schemas/citizen.schema';
import { IuranType } from '../iuran-types/schemas/iuran-type.schema';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Citizen.name) private citizenModel: Model<Citizen>,
    @InjectModel(IuranType.name) private iuranTypeModel: Model<IuranType>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    this.notificationsService.create({
      userId: payment.citizenId,
      title: dto.status === 'Lunas' ? 'Pembayaran Diverifikasi' : 'Pembayaran Ditolak',
      message: dto.status === 'Lunas'
        ? `Pembayaran ${payment.iuranTypeName} sebesar Rp ${payment.jumlah?.toLocaleString('id-ID')} telah diverifikasi lunas`
        : `Pembayaran ${payment.iuranTypeName} ditolak. Alasan: ${dto.rejectionReason || '-'}`,
      type: dto.status === 'Lunas' ? 'success' : 'error',
      module: 'payments',
      referenceId: payment._id,
      referenceUrl: `/finance`,
    });

    return { message: `Pembayaran berhasil ${dto.status === 'Lunas' ? 'diverifikasi' : 'ditolak'}`, data: payment };
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

    let created = 0;
    let skipped = 0;

    for (const c of citizens) {
      for (const it of iuranTypes) {
        // Check if this citizen is within the iuran type scope
        if (it.scopeLevel === 'rw' && c.rw !== it.rw) continue;
        if (it.scopeLevel === 'rt' && (c.rw !== it.rw || c.rt !== it.rt)) continue;

        // Check if payment already exists
        const exists = await this.paymentModel.findOne({
          citizenId: c._id,
          iuranTypeId: it._id,
          bulan,
          tahun,
        });

        if (exists) {
          skipped++;
          continue;
        }

        const payment = new this.paymentModel({
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
        await payment.save();
        created++;
      }
    }

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
