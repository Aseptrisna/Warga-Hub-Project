import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IuranType } from './schemas/iuran-type.schema';
import { CreateIuranTypeDto } from './dto/create-iuran-type.dto';
import { UpdateIuranTypeDto } from './dto/update-iuran-type.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class IuranTypesService {
  constructor(
    @InjectModel(IuranType.name) private iuranTypeModel: Model<IuranType>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateIuranTypeDto, userId: string, userName: string) {
    const iuranType = new this.iuranTypeModel({
      ...dto,
      createdBy: userId,
      createdByName: userName,
    });
    await iuranType.save();

    this.auditService.log({
      userId,
      userName,
      action: 'CREATE',
      module: 'iuran-types',
      entityId: iuranType._id,
      entityType: 'IuranType',
      description: `Membuat jenis iuran: ${dto.nama} - Rp ${dto.jumlah?.toLocaleString('id-ID')}`,
    });

    return { message: 'Jenis iuran berhasil dibuat', data: iuranType };
  }

  async findAll(query?: any) {
    const { page = 1, limit = 50, search, desa, rw, rt, isActive } = query || {};
    const filter: any = {};

    if (search) filter.nama = { $regex: search, $options: 'i' };
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

    const total = await this.iuranTypeModel.countDocuments(filter);
    const data = await this.iuranTypeModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get iuran types applicable to a user based on their region.
   * A user sees: desa-level types for their desa + rw-level types for their rw + rt-level types for their rt
   */
  async findApplicable(user: { desa?: string; rw?: string; rt?: string }) {
    const conditions: any[] = [];

    if (user.desa) {
      conditions.push({ desa: user.desa, scopeLevel: 'desa' });
    }
    if (user.desa && user.rw) {
      conditions.push({ desa: user.desa, rw: user.rw, scopeLevel: 'rw' });
    }
    if (user.desa && user.rw && user.rt) {
      conditions.push({ desa: user.desa, rw: user.rw, rt: user.rt, scopeLevel: 'rt' });
    }

    if (conditions.length === 0) return [];

    const data = await this.iuranTypeModel
      .find({ $or: conditions, isActive: true })
      .sort({ scopeLevel: 1, nama: 1 })
      .exec();

    return data;
  }

  async findOne(id: string) {
    const iuranType = await this.iuranTypeModel.findOne({ _id: id });
    if (!iuranType) throw new NotFoundException('Jenis iuran tidak ditemukan');
    return iuranType;
  }

  async update(id: string, dto: UpdateIuranTypeDto, user?: any) {
    const iuranType = await this.findOne(id);
    Object.assign(iuranType, dto);
    await iuranType.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      action: 'UPDATE',
      module: 'iuran-types',
      entityId: id,
      entityType: 'IuranType',
      description: `Memperbarui jenis iuran: ${iuranType.nama}`,
      changes: dto,
    });

    return { message: 'Jenis iuran berhasil diperbarui', data: iuranType };
  }

  async remove(id: string, user?: any) {
    const iuranType = await this.findOne(id);
    await this.iuranTypeModel.deleteOne({ _id: id });

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      action: 'DELETE',
      module: 'iuran-types',
      entityId: id,
      entityType: 'IuranType',
      description: `Menghapus jenis iuran: ${iuranType.nama}`,
    });

    return { message: 'Jenis iuran berhasil dihapus' };
  }
}
