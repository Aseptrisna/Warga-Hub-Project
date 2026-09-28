import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Umkm, UmkmDocument } from './schemas/umkm.schema';
import { CreateUmkmDto, UpdateUmkmDto, ReviewUmkmDto } from './dto/umkm.dto';
import { AuditService } from '../audit/audit.service';
import { Role } from '../../common/enums/role.enum';

export const UMKM_ADMIN_ROLES = [
  Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
  Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.KETUA_RT,
];

const PLATFORM_ROLES = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];

@Injectable()
export class UmkmService {
  constructor(
    @InjectModel(Umkm.name) private umkmModel: Model<UmkmDocument>,
    private readonly auditService: AuditService,
  ) {}

  private isAdmin(user: any) {
    return UMKM_ADMIN_ROLES.includes(user?.role);
  }

  private assertCanManage(umkm: UmkmDocument, user: any) {
    const isOwner = umkm.ownerUserId === String(user.id);
    if (isOwner) return;
    if (!this.isAdmin(user)) throw new ForbiddenException('Anda tidak berhak mengubah usaha ini');
    if (!PLATFORM_ROLES.includes(user.role) && umkm.desa !== user.desa) {
      throw new ForbiddenException('Usaha di luar wilayah Anda');
    }
  }

  async create(dto: CreateUmkmDto, user: any) {
    if (!user.desa && !PLATFORM_ROLES.includes(user.role)) {
      throw new BadRequestException('Akun Anda belum terhubung ke desa');
    }
    const autoApprove = this.isAdmin(user);
    const umkm = await this.umkmModel.create({
      ...dto,
      ownerUserId: String(user.id),
      ownerName: user.name,
      desa: user.desa,
      rw: user.rw,
      rt: user.rt,
      status: autoApprove ? 'Disetujui' : 'Menunggu',
      ...(autoApprove && { reviewedBy: user.name, reviewedAt: new Date() }),
    });

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      module: 'umkm',
      entityId: umkm._id,
      entityType: 'Umkm',
      description: `Mendaftarkan UMKM: ${umkm.nama}`,
    });

    return { message: autoApprove ? 'Usaha berhasil didaftarkan' : 'Usaha terkirim, menunggu persetujuan', data: umkm };
  }

  /**
   * Directory list. Non-platform users see their whole desa (the directory
   * is desa-wide, unlike RT-scoped data), and non-admins only see approved
   * entries.
   */
  async findAll(query: any, user: any) {
    const { page = 1, limit = 12, kategori, status, search } = query;
    const filter: any = {};

    if (!PLATFORM_ROLES.includes(user.role)) filter.desa = user.desa;
    if (this.isAdmin(user)) {
      if (status) filter.status = status;
    } else {
      filter.status = 'Disetujui';
    }
    if (kategori) filter.kategori = kategori;
    if (search) {
      const rx = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      filter.$or = [{ nama: rx }, { deskripsi: rx }];
    }

    return this.paginate(filter, Number(page), Number(limit));
  }

  async findPublic(query: any) {
    const { desa, page = 1, limit = 12, kategori } = query;
    if (!desa) throw new BadRequestException('Parameter desa wajib diisi');
    const filter: any = { desa, status: 'Disetujui' };
    if (kategori) filter.kategori = kategori;
    const result = await this.paginate(filter, Number(page), Number(limit));
    // Public view: hide internal review fields
    result.data = result.data.map((u: any) => {
      const { ownerUserId, reviewedBy, reviewedAt, rejectionReason, ...rest } = u.toJSON();
      return rest;
    });
    return result;
  }

  private async paginate(filter: any, page: number, limit: number) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const [total, data] = await Promise.all([
      this.umkmModel.countDocuments(filter),
      this.umkmModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((Math.max(page, 1) - 1) * safeLimit)
        .limit(safeLimit)
        .exec(),
    ]);
    return {
      data: data as any[],
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async findMine(user: any) {
    const data = await this.umkmModel.find({ ownerUserId: String(user.id) }).sort({ createdAt: -1 }).exec();
    return { data };
  }

  async findOne(id: string, user: any) {
    const umkm = await this.umkmModel.findOne({ _id: id });
    if (!umkm) throw new NotFoundException('Usaha tidak ditemukan');
    const isOwner = umkm.ownerUserId === String(user.id);
    if (umkm.status !== 'Disetujui' && !isOwner && !this.isAdmin(user)) {
      throw new NotFoundException('Usaha tidak ditemukan');
    }
    return umkm;
  }

  async update(id: string, dto: UpdateUmkmDto, user: any) {
    const umkm = await this.findOne(id, user);
    this.assertCanManage(umkm, user);
    Object.assign(umkm, dto);
    // An owner's edit to a rejected entry resubmits it for review
    if (umkm.status === 'Ditolak' && umkm.ownerUserId === String(user.id) && !this.isAdmin(user)) {
      umkm.status = 'Menunggu';
      umkm.rejectionReason = undefined;
    }
    await umkm.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      module: 'umkm',
      entityId: umkm._id,
      entityType: 'Umkm',
      description: `Memperbarui UMKM: ${umkm.nama}`,
      changes: dto,
    });

    return { message: 'Usaha berhasil diperbarui', data: umkm };
  }

  async setFoto(id: string, fotoUrl: string, user: any) {
    if (!fotoUrl) throw new BadRequestException('File foto tidak ditemukan');
    const umkm = await this.findOne(id, user);
    this.assertCanManage(umkm, user);
    umkm.fotoUrl = fotoUrl;
    await umkm.save();
    return { message: 'Foto berhasil diunggah', data: umkm };
  }

  async review(id: string, dto: ReviewUmkmDto, user: any) {
    const umkm = await this.findOne(id, user);
    this.assertCanManage(umkm, user);
    if (dto.status === 'Ditolak' && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Alasan penolakan wajib diisi');
    }
    umkm.status = dto.status;
    umkm.rejectionReason = dto.status === 'Ditolak' ? dto.rejectionReason : undefined;
    umkm.reviewedBy = user.name;
    umkm.reviewedAt = new Date();
    await umkm.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      module: 'umkm',
      entityId: umkm._id,
      entityType: 'Umkm',
      description: `Review UMKM ${dto.status}: ${umkm.nama}`,
    });

    return { message: `Usaha ${dto.status === 'Disetujui' ? 'disetujui' : 'ditolak'}`, data: umkm };
  }

  async remove(id: string, user: any) {
    const umkm = await this.findOne(id, user);
    this.assertCanManage(umkm, user);
    await umkm.deleteOne();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      module: 'umkm',
      entityId: umkm._id,
      entityType: 'Umkm',
      description: `Menghapus UMKM: ${umkm.nama}`,
    });

    return { message: 'Usaha berhasil dihapus' };
  }
}
