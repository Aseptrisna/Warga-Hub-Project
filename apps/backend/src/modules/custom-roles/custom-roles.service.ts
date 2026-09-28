import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomRole, CustomRoleDocument } from './schemas/custom-role.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
import { AuditService } from '../audit/audit.service';

const BUILT_IN_ROLE_VALUES = new Set<string>(Object.values(Role));
const CACHE_TTL_MS = 30_000;

@Injectable()
export class CustomRolesService {
  // Small in-memory cache so RolesGuard (which resolves effective roles on
  // every guarded request) doesn't hit MongoDB per request for custom-role
  // users. Invalidated on every write.
  private cache = new Map<string, { role: CustomRoleDocument | null; expiresAt: number }>();

  constructor(
    @InjectModel(CustomRole.name) private customRoleModel: Model<CustomRoleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Resolves a user's `role` field (either a built-in Role enum value or a
   * custom role code) into the set of built-in roles that should be treated
   * as granted for RolesGuard / any `@Roles(...)` check.
   */
  async getEffectiveRoles(roleCode: string): Promise<Role[]> {
    if (BUILT_IN_ROLE_VALUES.has(roleCode)) {
      return [roleCode as Role];
    }

    const customRole = await this.findCached(roleCode);
    if (!customRole || !customRole.isActive) return [];
    return customRole.baseRoles;
  }

  /** Menu paths + label for a given role code, for sidebar rendering. Null = built-in role, use static config. */
  async getMenuInfo(roleCode: string): Promise<{ menuPaths: string[]; label: string } | null> {
    if (BUILT_IN_ROLE_VALUES.has(roleCode)) return null;
    const customRole = await this.findCached(roleCode);
    if (!customRole || !customRole.isActive) return { menuPaths: [], label: roleCode };
    return { menuPaths: customRole.menuPaths, label: customRole.label };
  }

  async isValidRoleCode(roleCode: string): Promise<boolean> {
    if (BUILT_IN_ROLE_VALUES.has(roleCode)) return true;
    const customRole = await this.findCached(roleCode);
    return !!customRole && customRole.isActive;
  }

  private async findCached(code: string): Promise<CustomRoleDocument | null> {
    const cached = this.cache.get(code);
    if (cached && cached.expiresAt > Date.now()) return cached.role;

    const role = await this.customRoleModel.findOne({ code }).exec();
    this.cache.set(code, { role, expiresAt: Date.now() + CACHE_TTL_MS });
    return role;
  }

  private invalidateCache(code?: string) {
    if (code) this.cache.delete(code);
    else this.cache.clear();
  }

  async findAll(): Promise<Array<Record<string, any>>> {
    // Custom roles are admin-created and inherently small in number; a hard
    // cap (rather than full pagination) is enough to keep this endpoint
    // bounded without changing its response shape for existing callers.
    const roles = await this.customRoleModel.find().sort({ createdAt: -1 }).limit(500).exec();
    const counts = await this.userModel.aggregate([
      { $match: { role: { $in: roles.map((r) => r.code) } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));
    return roles.map((r) => ({ ...r.toJSON(), usersCount: countMap.get(r.code) || 0 }));
  }

  async findOne(code: string) {
    const role = await this.customRoleModel.findOne({ code });
    if (!role) throw new NotFoundException('Role tidak ditemukan');
    return role;
  }

  async create(dto: CreateCustomRoleDto, user: any) {
    if (BUILT_IN_ROLE_VALUES.has(dto.code)) {
      throw new BadRequestException('Kode role bentrok dengan role bawaan sistem');
    }
    const existing = await this.customRoleModel.findOne({ code: dto.code });
    if (existing) {
      throw new BadRequestException('Kode role sudah digunakan');
    }

    const role = new this.customRoleModel({
      ...dto,
      isActive: true,
      createdBy: user?.id,
      createdByName: user?.name,
    });
    await role.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      action: 'CREATE',
      module: 'custom-roles',
      entityId: role._id,
      entityType: 'CustomRole',
      description: `Membuat role baru: ${role.label} (${role.code})`,
    });

    return { message: 'Role berhasil dibuat', data: role };
  }

  async update(code: string, dto: UpdateCustomRoleDto, user: any) {
    const role = await this.findOne(code);
    Object.assign(role, dto);
    await role.save();
    this.invalidateCache(code);

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      action: 'UPDATE',
      module: 'custom-roles',
      entityId: role._id,
      entityType: 'CustomRole',
      description: `Memperbarui role: ${role.label} (${role.code})`,
      changes: dto,
    });

    return { message: 'Role berhasil diperbarui', data: role };
  }

  async remove(code: string, user: any) {
    const role = await this.findOne(code);
    const usersWithRole = await this.userModel.countDocuments({ role: code });
    if (usersWithRole > 0) {
      throw new BadRequestException(
        `Role masih digunakan oleh ${usersWithRole} user. Pindahkan role user tersebut terlebih dahulu.`,
      );
    }

    await role.deleteOne();
    this.invalidateCache(code);

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      action: 'DELETE',
      module: 'custom-roles',
      entityId: role._id,
      entityType: 'CustomRole',
      description: `Menghapus role: ${role.label} (${role.code})`,
    });

    return { message: 'Role berhasil dihapus' };
  }
}
