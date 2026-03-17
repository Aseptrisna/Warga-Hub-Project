import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Family } from './schemas/family.schema';
import { Citizen } from '../citizens/schemas/citizen.schema';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { AuditService } from '../audit/audit.service';
import { Role } from '../../common/enums/role.enum';

const PLATFORM_ROLES = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];
const DESA_ROLES = [Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PEMERINTAHAN];
const RW_ROLES = [Role.KETUA_RW, Role.ADMIN_RW];
const RT_ROLES = [Role.KETUA_RT, Role.ADMIN_RT];

@Injectable()
export class FamiliesService {
  constructor(
    @InjectModel(Family.name) private familyModel: Model<Family>,
    @InjectModel(Citizen.name) private citizenModel: Model<Citizen>,
    private readonly auditService: AuditService,
  ) {}

  private validateFamilyScope(familyData: any, user: any) {
    if (!user) return;
    if (PLATFORM_ROLES.includes(user.role)) return;

    if (DESA_ROLES.includes(user.role)) {
      if (user.desa && familyData.desa && familyData.desa !== user.desa) {
        throw new ForbiddenException('Anda hanya dapat mengelola data keluarga di desa Anda');
      }
    } else if (RW_ROLES.includes(user.role)) {
      if (user.desa && familyData.desa && familyData.desa !== user.desa) {
        throw new ForbiddenException('Anda hanya dapat mengelola data keluarga di RW Anda');
      }
      if (user.rw && familyData.rw && familyData.rw !== user.rw) {
        throw new ForbiddenException('Anda hanya dapat mengelola data keluarga di RW Anda');
      }
    } else if (RT_ROLES.includes(user.role)) {
      if (user.desa && familyData.desa && familyData.desa !== user.desa) {
        throw new ForbiddenException('Anda hanya dapat mengelola data keluarga di RT Anda');
      }
      if (user.rw && familyData.rw && familyData.rw !== user.rw) {
        throw new ForbiddenException('Anda hanya dapat mengelola data keluarga di RT Anda');
      }
      if (user.rt && familyData.rt && familyData.rt !== user.rt) {
        throw new ForbiddenException('Anda hanya dapat mengelola data keluarga di RT Anda');
      }
    }
  }

  private validateFamilyBelongsToScope(family: any, user: any) {
    if (!user) return;
    if (PLATFORM_ROLES.includes(user.role)) return;

    if (DESA_ROLES.includes(user.role)) {
      if (user.desa && family.desa && family.desa !== user.desa) {
        throw new ForbiddenException('Data keluarga ini di luar wilayah Anda');
      }
    } else if (RW_ROLES.includes(user.role)) {
      if (user.desa && family.desa && family.desa !== user.desa) {
        throw new ForbiddenException('Data keluarga ini di luar wilayah Anda');
      }
      if (user.rw && family.rw && family.rw !== user.rw) {
        throw new ForbiddenException('Data keluarga ini di luar wilayah Anda');
      }
    } else if (RT_ROLES.includes(user.role)) {
      if (user.desa && family.desa && family.desa !== user.desa) {
        throw new ForbiddenException('Data keluarga ini di luar wilayah Anda');
      }
      if (user.rw && family.rw && family.rw !== user.rw) {
        throw new ForbiddenException('Data keluarga ini di luar wilayah Anda');
      }
      if (user.rt && family.rt && family.rt !== user.rt) {
        throw new ForbiddenException('Data keluarga ini di luar wilayah Anda');
      }
    }
  }

  async create(createFamilyDto: CreateFamilyDto, user?: any) {
    this.validateFamilyScope(createFamilyDto, user);

    const existing = await this.familyModel.findOne({ noKk: createFamilyDto.noKk });
    if (existing) {
      throw new ConflictException('Nomor KK sudah terdaftar');
    }

    // Count members from citizens
    const memberCount = await this.citizenModel.countDocuments({ noKk: createFamilyDto.noKk });

    const family = new this.familyModel({
      ...createFamilyDto,
      jumlahAnggota: memberCount || createFamilyDto.jumlahAnggota || 0,
      createdBy: user?.id,
    });
    await family.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'CREATE',
      module: 'families',
      entityId: family._id,
      entityType: 'Family',
      description: `Menambahkan kartu keluarga: ${createFamilyDto.noKk} (${createFamilyDto.kepalaKeluargaNama})`,
    });

    return {
      message: 'Kartu keluarga berhasil ditambahkan',
      data: family,
    };
  }

  async findAll(query?: any) {
    const {
      page = 1,
      limit = 10,
      search,
      rt,
      rw,
      desa,
      isActive,
    } = query || {};

    const filter: any = {};

    if (search) {
      filter.$or = [
        { noKk: { $regex: search, $options: 'i' } },
        { kepalaKeluargaNama: { $regex: search, $options: 'i' } },
        { alamat: { $regex: search, $options: 'i' } },
      ];
    }

    if (rt) filter.rt = rt;
    if (rw) filter.rw = rw;
    if (desa) filter.desa = desa;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const total = await this.familyModel.countDocuments(filter);
    const families = await this.familyModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ kepalaKeluargaNama: 1 })
      .exec();

    return {
      data: families,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user?: any) {
    const family = await this.familyModel.findOne({ _id: id });
    if (!family) {
      throw new NotFoundException('Kartu keluarga tidak ditemukan');
    }
    this.validateFamilyBelongsToScope(family, user);
    return family;
  }

  async getMembers(id: string, user?: any) {
    const family = await this.findOne(id, user);
    const members = await this.citizenModel
      .find({ noKk: family.noKk })
      .sort({ statusHubunganDalamKeluarga: 1, namaLengkap: 1 })
      .exec();

    return {
      data: members,
      total: members.length,
    };
  }

  async update(id: string, updateFamilyDto: UpdateFamilyDto, user?: any) {
    const family = await this.familyModel.findOne({ _id: id });
    if (!family) {
      throw new NotFoundException('Kartu keluarga tidak ditemukan');
    }
    this.validateFamilyBelongsToScope(family, user);

    if (updateFamilyDto.noKk && updateFamilyDto.noKk !== family.noKk) {
      const existing = await this.familyModel.findOne({ noKk: updateFamilyDto.noKk });
      if (existing) {
        throw new ConflictException('Nomor KK sudah terdaftar');
      }
    }

    Object.assign(family, updateFamilyDto);
    await family.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'UPDATE',
      module: 'families',
      entityId: family._id,
      entityType: 'Family',
      description: `Memperbarui kartu keluarga: ${family.noKk}`,
      changes: { ...updateFamilyDto },
    });

    return {
      message: 'Kartu keluarga berhasil diperbarui',
      data: family,
    };
  }

  async remove(id: string, user?: any) {
    const family = await this.familyModel.findOne({ _id: id });
    if (!family) {
      throw new NotFoundException('Kartu keluarga tidak ditemukan');
    }
    this.validateFamilyBelongsToScope(family, user);

    await this.familyModel.deleteOne({ _id: id });

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'DELETE',
      module: 'families',
      entityId: id,
      entityType: 'Family',
      description: `Menghapus kartu keluarga: ${family.noKk}`,
    });

    return {
      message: 'Kartu keluarga berhasil dihapus',
    };
  }

  async syncMemberCount(id: string) {
    const family = await this.familyModel.findOne({ _id: id });
    if (!family) {
      throw new NotFoundException('Kartu keluarga tidak ditemukan');
    }
    const count = await this.citizenModel.countDocuments({ noKk: family.noKk });
    family.jumlahAnggota = count;
    await family.save();

    return {
      message: 'Jumlah anggota berhasil disinkronkan',
      data: family,
    };
  }

  async getStatistics(filter?: any) {
    const matchFilter: any = {};
    if (filter?.rt) matchFilter.rt = filter.rt;
    if (filter?.rw) matchFilter.rw = filter.rw;
    if (filter?.desa) matchFilter.desa = filter.desa;

    const stats = await this.familyModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalKeluarga: { $sum: 1 },
          totalAnggota: { $sum: '$jumlahAnggota' },
          aktif: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          tidakAktif: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
          },
        },
      },
    ]);

    return stats[0] || {
      totalKeluarga: 0,
      totalAnggota: 0,
      aktif: 0,
      tidakAktif: 0,
    };
  }
}
