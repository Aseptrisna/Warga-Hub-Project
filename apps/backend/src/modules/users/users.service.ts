import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Citizen } from '../citizens/schemas/citizen.schema';
import { Role } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

const PLATFORM_ROLES = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];

// Roles that AdminDesa is allowed to create/manage
const ADMIN_DESA_MANAGEABLE_ROLES: Role[] = [
  Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
  Role.KAUR_KEUANGAN, Role.KAUR_UMUM,
  Role.KASI_PEMERINTAHAN, Role.KASI_KESEJAHTERAAN, Role.KASI_PELAYANAN,
  Role.KETUA_RW, Role.ADMIN_RW,
  Role.KETUA_RT, Role.ADMIN_RT,
  Role.PETUGAS_RONDA, Role.WARGA,
];

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Citizen.name) private citizenModel: Model<Citizen>,
  ) {}

  async create(dto: CreateUserDto, currentUser?: any) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    // AdminDesa scope enforcement
    if (currentUser?.role === Role.ADMIN_DESA) {
      if (!ADMIN_DESA_MANAGEABLE_ROLES.includes(dto.role as Role)) {
        throw new ForbiddenException('Anda tidak dapat membuat user dengan role tersebut');
      }
      // Force desa to admin's desa
      dto.desa = currentUser.desa;
    }

    const user = new this.userModel({
      ...dto,
      email: dto.email.toLowerCase(),
      isActive: true,
      isEmailVerified: true,
    });
    await user.save();

    return {
      message: 'User berhasil dibuat',
      data: user.toJSON(),
    };
  }

  async getStatistics(currentUser?: any) {
    const baseFilter: any = {};

    // AdminDesa: only see stats for their desa
    if (currentUser?.role === Role.ADMIN_DESA) {
      baseFilter.desa = currentUser.desa;
    }

    const [totalUsers, activeUsers, inactiveUsers, byRole, byDesa] = await Promise.all([
      this.userModel.countDocuments(baseFilter),
      this.userModel.countDocuments({ ...baseFilter, isActive: true }),
      this.userModel.countDocuments({ ...baseFilter, isActive: false }),
      this.userModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.userModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$desa', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      byRole: byRole.map((r) => ({ role: r._id, count: r.count })),
      byDesa: byDesa.filter((d) => d._id).map((d) => ({ desa: d._id, count: d.count })),
    };
  }

  /**
   * Get pending activation Warga accounts (scope-filtered)
   */
  async getPendingActivation(query?: any, adminUser?: any) {
    const { page = 1, limit = 20 } = query || {};
    const filter: any = { isActive: false, role: Role.WARGA };

    // Apply scope filter so RT admin only sees their RT
    if (adminUser && !PLATFORM_ROLES.includes(adminUser.role)) {
      const scope = getRegionScope(adminUser);
      if (scope.desa) filter.desa = scope.desa;
      if (scope.rw) filter.rw = scope.rw;
      if (scope.rt) filter.rt = scope.rt;
    }

    const total = await this.userModel.countDocuments(filter);
    const users = await this.userModel
      .find(filter)
      .select('-password -refreshToken -resetPasswordToken -emailVerificationToken')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    // Enrich with citizen data
    const enriched = await Promise.all(
      users.map(async (u) => {
        const userObj = u.toJSON();
        if (u.citizenId) {
          const citizen = await this.citizenModel.findOne({ _id: u.citizenId }).lean();
          if (citizen) {
            (userObj as any).citizen = {
              namaLengkap: citizen.namaLengkap,
              nik: citizen.nik,
              desa: citizen.desa,
              rw: citizen.rw,
              rt: citizen.rt,
              alamat: citizen.alamat,
            };
          }
        }
        return userObj;
      }),
    );

    return {
      data: enriched,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Activate a pending Warga account
   */
  async activateWarga(id: string, adminUser: any) {
    const user = await this.userModel.findOne({ _id: id });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    if (user.isActive) {
      throw new BadRequestException('User sudah aktif');
    }

    if (user.role !== Role.WARGA) {
      throw new BadRequestException('Hanya akun Warga yang bisa diaktivasi melalui endpoint ini');
    }

    // Scope validation
    if (!PLATFORM_ROLES.includes(adminUser.role as Role)) {
      const scope = getRegionScope(adminUser);
      if (scope.desa && user.desa !== scope.desa) throw new ForbiddenException('User di luar wilayah Anda');
      if (scope.rw && user.rw !== scope.rw) throw new ForbiddenException('User di luar wilayah Anda');
      if (scope.rt && user.rt !== scope.rt) throw new ForbiddenException('User di luar wilayah Anda');
    }

    user.isActive = true;
    await user.save();

    return { message: `Akun ${user.name} berhasil diaktifkan`, data: user.toJSON() };
  }

  /**
   * Reject a pending Warga activation - delete user + clear citizen.userId
   */
  async rejectWargaActivation(id: string, adminUser: any, reason?: string) {
    const user = await this.userModel.findOne({ _id: id });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    if (user.isActive) {
      throw new BadRequestException('User sudah aktif, tidak bisa ditolak');
    }

    if (user.role !== Role.WARGA) {
      throw new BadRequestException('Hanya akun Warga yang bisa ditolak melalui endpoint ini');
    }

    // Scope validation
    if (!PLATFORM_ROLES.includes(adminUser.role as Role)) {
      const scope = getRegionScope(adminUser);
      if (scope.desa && user.desa !== scope.desa) throw new ForbiddenException('User di luar wilayah Anda');
      if (scope.rw && user.rw !== scope.rw) throw new ForbiddenException('User di luar wilayah Anda');
      if (scope.rt && user.rt !== scope.rt) throw new ForbiddenException('User di luar wilayah Anda');
    }

    // Clear citizen.userId link
    if (user.citizenId) {
      await this.citizenModel.updateOne(
        { _id: user.citizenId },
        { $unset: { userId: 1 } },
      );
    }

    // Delete the user
    await this.userModel.deleteOne({ _id: id });

    return { message: `Registrasi ${user.name} ditolak${reason ? ': ' + reason : ''}` };
  }

  async findAll(query?: any, currentUser?: any) {
    const { page = 1, limit = 10, search, role, isActive, desa, rw, rt } = query || {};
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;

    // AdminDesa scope: only see users in their desa
    if (currentUser?.role === Role.ADMIN_DESA) {
      filter.desa = currentUser.desa;
    }

    const total = await this.userModel.countDocuments(filter);
    const users = await this.userModel
      .find(filter)
      .select('-password -refreshToken -resetPasswordToken -emailVerificationToken')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data: users,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, currentUser?: any) {
    const user = await this.userModel.findOne({ _id: id })
      .select('-password -refreshToken -resetPasswordToken -emailVerificationToken');
    if (!user) throw new NotFoundException('User tidak ditemukan');

    // AdminDesa scope check
    if (currentUser?.role === Role.ADMIN_DESA && user.desa !== currentUser.desa) {
      throw new ForbiddenException('User di luar wilayah Anda');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUser?: any) {
    const user = await this.userModel.findOne({ _id: id });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    // AdminDesa scope enforcement
    if (currentUser?.role === Role.ADMIN_DESA) {
      if (user.desa !== currentUser.desa) {
        throw new ForbiddenException('User di luar wilayah Anda');
      }
      // Prevent changing role to something AdminDesa can't manage
      if (dto.role && !ADMIN_DESA_MANAGEABLE_ROLES.includes(dto.role as Role)) {
        throw new ForbiddenException('Anda tidak dapat mengubah ke role tersebut');
      }
      // Prevent changing desa
      if (dto.desa && dto.desa !== currentUser.desa) {
        throw new ForbiddenException('Anda tidak dapat memindahkan user ke desa lain');
      }
    }

    const allowed: (keyof UpdateUserDto)[] = ['name', 'phone', 'role', 'desa', 'rw', 'rt', 'isActive'];
    for (const key of allowed) {
      if (dto[key] !== undefined) (user as any)[key] = dto[key];
    }
    await user.save();
    return { message: 'User berhasil diperbarui', data: user };
  }

  async changeRole(id: string, role: Role) {
    const user = await this.userModel.findOne({ _id: id });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    user.role = role;
    await user.save();
    return { message: 'Role berhasil diubah', data: user };
  }

  async toggleActive(id: string, currentUser?: any) {
    const user = await this.userModel.findOne({ _id: id });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    // AdminDesa scope check
    if (currentUser?.role === Role.ADMIN_DESA && user.desa !== currentUser.desa) {
      throw new ForbiddenException('User di luar wilayah Anda');
    }

    user.isActive = !user.isActive;
    await user.save();
    return { message: `User ${user.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, data: user };
  }

  async remove(id: string, currentUser?: any) {
    const user = await this.userModel.findOne({ _id: id });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    // AdminDesa scope check
    if (currentUser?.role === Role.ADMIN_DESA) {
      if (user.desa !== currentUser.desa) {
        throw new ForbiddenException('User di luar wilayah Anda');
      }
      if (!ADMIN_DESA_MANAGEABLE_ROLES.includes(user.role as Role)) {
        throw new ForbiddenException('Anda tidak dapat menghapus user dengan role tersebut');
      }
    }

    await this.userModel.deleteOne({ _id: id });
    return { message: 'User berhasil dihapus' };
  }
}
