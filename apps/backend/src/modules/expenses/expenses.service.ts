import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense } from './schemas/expense.schema';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, user?: any) {
    const expense = new this.expenseModel({
      ...createExpenseDto,
      createdBy: user?.id,
      createdByName: user?.name,
    });
    await expense.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'CREATE',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'Expense',
      description: `Menambahkan pengeluaran: ${createExpenseDto.keterangan} - Rp ${createExpenseDto.jumlah}`,
    });

    return {
      message: 'Pengeluaran berhasil ditambahkan',
      data: expense,
    };
  }

  async findAll(query?: any) {
    const {
      search,
      kategori,
      status,
      desa,
      rt,
      rw,
      startDate,
      endDate,
    } = query || {};

    const pageNum = parseInt(query?.page) || 1;
    const limitNum = parseInt(query?.limit) || 10;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { keterangan: { $regex: search, $options: 'i' } },
        { penerimaNama: { $regex: search, $options: 'i' } },
      ];
    }

    if (kategori) filter.kategori = kategori;
    if (status) filter.status = status;
    if (desa) filter.desa = desa;
    if (rt) filter.rt = rt;
    if (rw) filter.rw = rw;

    if (startDate || endDate) {
      filter.tanggalPengeluaran = {};
      if (startDate) filter.tanggalPengeluaran.$gte = new Date(startDate);
      if (endDate) filter.tanggalPengeluaran.$lte = new Date(endDate);
    }

    const total = await this.expenseModel.countDocuments(filter);
    const expenses = await this.expenseModel
      .find(filter)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ tanggalPengeluaran: -1 })
      .exec();

    return {
      data: expenses,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string) {
    const expense = await this.expenseModel.findOne({ _id: id });
    if (!expense) {
      throw new NotFoundException('Pengeluaran tidak ditemukan');
    }
    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(id);

    if (expense.status === 'Approved') {
      throw new BadRequestException('Pengeluaran yang sudah disetujui tidak bisa diubah');
    }

    Object.assign(expense, updateExpenseDto);
    await expense.save();

    return {
      message: 'Pengeluaran berhasil diperbarui',
      data: expense,
    };
  }

  async approve(id: string, user: any) {
    const expense = await this.findOne(id);

    if (expense.status !== 'Pending') {
      throw new BadRequestException('Hanya pengeluaran berstatus Pending yang bisa disetujui');
    }

    expense.status = 'Approved';
    expense.approvedBy = user.id;
    expense.approvedByName = user.name;
    expense.approvedAt = new Date();
    await expense.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'APPROVE',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'Expense',
      description: `Menyetujui pengeluaran: ${expense.keterangan} - Rp ${expense.jumlah}`,
    });

    // Notify the creator that expense is approved
    if (expense.createdBy) {
      this.notificationsService.create({
        userId: expense.createdBy,
        title: 'Pengeluaran Disetujui',
        message: `Pengeluaran "${expense.keterangan}" sebesar Rp ${expense.jumlah?.toLocaleString('id-ID')} telah disetujui`,
        type: 'success',
        module: 'expenses',
        referenceId: expense._id,
        referenceUrl: `/expenses/${expense._id}`,
      }).catch((err) => this.logger.error('Failed to notify creator of expense approval', err));
    }

    return {
      message: 'Pengeluaran berhasil disetujui',
      data: expense,
    };
  }

  async reject(id: string, user: any, reason?: string) {
    const expense = await this.findOne(id);

    if (expense.status !== 'Pending') {
      throw new BadRequestException('Hanya pengeluaran berstatus Pending yang bisa ditolak');
    }

    expense.status = 'Rejected';
    expense.approvedBy = user.id;
    expense.approvedByName = user.name;
    expense.approvedAt = new Date();
    expense.rejectionReason = reason;
    await expense.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'REJECT',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'Expense',
      description: `Menolak pengeluaran: ${expense.keterangan} (Alasan: ${reason || '-'})`,
    });

    // Notify the creator that expense is rejected
    if (expense.createdBy) {
      this.notificationsService.create({
        userId: expense.createdBy,
        title: 'Pengeluaran Ditolak',
        message: `Pengeluaran "${expense.keterangan}" ditolak. Alasan: ${reason || '-'}`,
        type: 'error',
        module: 'expenses',
        referenceId: expense._id,
        referenceUrl: `/expenses/${expense._id}`,
      }).catch((err) => this.logger.error('Failed to notify creator of expense rejection', err));
    }

    return {
      message: 'Pengeluaran ditolak',
      data: expense,
    };
  }

  async remove(id: string, user?: any) {
    const expense = await this.findOne(id);
    await this.expenseModel.deleteOne({ _id: id });

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'DELETE',
      module: 'expenses',
      entityId: id,
      entityType: 'Expense',
      description: `Menghapus pengeluaran: ${expense.keterangan}`,
    });

    return {
      message: 'Pengeluaran berhasil dihapus',
    };
  }

  async getStatistics(filter?: any) {
    const matchFilter: any = {};
    if (filter?.desa) matchFilter.desa = filter.desa;
    if (filter?.rt) matchFilter.rt = filter.rt;
    if (filter?.rw) matchFilter.rw = filter.rw;

    const stats = await this.expenseModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalPengeluaran: { $sum: '$jumlah' },
          totalApproved: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, '$jumlah', 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$jumlah', 0] },
          },
          totalRejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, '$jumlah', 0] },
          },
          count: { $sum: 1 },
          countApproved: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] },
          },
          countPending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
          },
          countRejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] },
          },
        },
      },
    ]);

    // Per category breakdown
    const byCategory = await this.expenseModel.aggregate([
      { $match: { ...matchFilter, status: 'Approved' } },
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
      ...(stats[0] || {
        totalPengeluaran: 0,
        totalApproved: 0,
        totalPending: 0,
        totalRejected: 0,
        count: 0,
        countApproved: 0,
        countPending: 0,
        countRejected: 0,
      }),
      byCategory,
    };
  }
}
