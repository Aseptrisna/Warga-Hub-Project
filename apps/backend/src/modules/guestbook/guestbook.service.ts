import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GuestbookEntry } from './schemas/guestbook-entry.schema';
import { CreateGuestbookEntryDto } from './dto/create-guestbook-entry.dto';
import { UpdateGuestbookEntryDto } from './dto/update-guestbook-entry.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GuestbookService {
  constructor(
    @InjectModel(GuestbookEntry.name) private guestbookModel: Model<GuestbookEntry>,
    private readonly auditService: AuditService,
  ) {}

  async create(createDto: CreateGuestbookEntryDto, user?: any) {
    const entry = new this.guestbookModel({
      ...createDto,
      status: 'Masuk',
      createdBy: user?.id,
      createdByName: user?.name,
    });
    await entry.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'CREATE',
      module: 'guestbook',
      entityId: entry._id,
      entityType: 'GuestbookEntry',
      description: `Mencatat tamu masuk: ${createDto.namaTamu}`,
    });

    return {
      message: 'Tamu berhasil dicatat',
      data: entry,
    };
  }

  async findAll(query?: any) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      desa,
      rt,
      rw,
      startDate,
      endDate,
    } = query || {};

    const filter: any = {};

    if (search) {
      filter.$or = [
        { namaTamu: { $regex: search, $options: 'i' } },
        { tujuan: { $regex: search, $options: 'i' } },
        { yangDitemui: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (desa) filter.desa = desa;
    if (rt) filter.rt = rt;
    if (rw) filter.rw = rw;

    if (startDate || endDate) {
      filter.waktuMasuk = {};
      if (startDate) filter.waktuMasuk.$gte = new Date(startDate);
      if (endDate) filter.waktuMasuk.$lte = new Date(endDate);
    }

    const total = await this.guestbookModel.countDocuments(filter);
    const entries = await this.guestbookModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ waktuMasuk: -1 })
      .exec();

    return {
      data: entries,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const entry = await this.guestbookModel.findOne({ _id: id });
    if (!entry) {
      throw new NotFoundException('Data buku tamu tidak ditemukan');
    }
    return entry;
  }

  async update(id: string, updateDto: UpdateGuestbookEntryDto) {
    const entry = await this.findOne(id);
    Object.assign(entry, updateDto);
    await entry.save();

    return {
      message: 'Data buku tamu berhasil diperbarui',
      data: entry,
    };
  }

  async checkout(id: string, user?: any) {
    const entry = await this.findOne(id);

    if (entry.status === 'Keluar') {
      throw new BadRequestException('Tamu sudah tercatat keluar');
    }

    entry.status = 'Keluar';
    entry.waktuKeluar = new Date();
    await entry.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'UPDATE',
      module: 'guestbook',
      entityId: entry._id,
      entityType: 'GuestbookEntry',
      description: `Checkout tamu: ${entry.namaTamu}`,
    });

    return {
      message: 'Tamu berhasil checkout',
      data: entry,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.guestbookModel.deleteOne({ _id: id });

    return {
      message: 'Data buku tamu berhasil dihapus',
    };
  }

  async getStatistics(filter?: any) {
    const matchFilter: any = {};
    if (filter?.desa) matchFilter.desa = filter.desa;
    if (filter?.rt) matchFilter.rt = filter.rt;
    if (filter?.rw) matchFilter.rw = filter.rw;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.guestbookModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          masuk: {
            $sum: { $cond: [{ $eq: ['$status', 'Masuk'] }, 1, 0] },
          },
          keluar: {
            $sum: { $cond: [{ $eq: ['$status', 'Keluar'] }, 1, 0] },
          },
          hariIni: {
            $sum: { $cond: [{ $gte: ['$waktuMasuk', today] }, 1, 0] },
          },
        },
      },
    ]);

    return stats[0] || {
      total: 0,
      masuk: 0,
      keluar: 0,
      hariIni: 0,
    };
  }
}
