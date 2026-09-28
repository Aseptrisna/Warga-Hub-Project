import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Region, RegionDocument, RegionType } from './schemas/region.schema';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateDesaLandingDto } from './dto/update-desa-landing.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Role } from '../../common/enums/role.enum';

const PLATFORM_ROLES = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];
const DESA_ROLES = [Role.ADMIN_DESA, Role.KEPALA_DESA, Role.SEKRETARIS_DESA];
const RW_ROLES = [Role.KETUA_RW, Role.ADMIN_RW];
const RT_ROLES = [Role.KETUA_RT, Role.ADMIN_RT];

@Injectable()
export class RegionsService {
  constructor(
    @InjectModel(Region.name) private regionModel: Model<RegionDocument>,
  ) {}

  async create(createRegionDto: CreateRegionDto, user?: any): Promise<Region> {
    // Validate parent exists if parentId provided
    if (createRegionDto.parentId) {
      const parent = await this.regionModel.findOne({ _id: createRegionDto.parentId });
      if (!parent) {
        throw new NotFoundException('Parent region not found');
      }

      // Validate hierarchy
      this.validateHierarchy(createRegionDto.type, parent.type);
    }

    // Scope validation for non-platform roles
    if (user && !PLATFORM_ROLES.includes(user.role)) {
      this.validateCreateScope(createRegionDto, user);

      // Validate parent is within user's scope
      if (createRegionDto.parentId) {
        await this.validateUserScope(user, createRegionDto.parentId);
      }
    }

    const region = new this.regionModel(createRegionDto);
    return region.save();
  }

  async findAll(query?: {
    type?: RegionType;
    parentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Region[]; meta: any }> {
    const { type, parentId, search, page = 1, limit = 50 } = query || {};
    const filter: any = {};

    if (type) filter.type = type;
    if (parentId) filter.parentId = parentId;
    if (search) filter.$text = { $search: search };

    const total = await this.regionModel.countDocuments(filter);
    const data = await this.regionModel
      .find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Region> {
    const region = await this.regionModel.findOne({ _id: id });
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    return region;
  }

  async findBySubdomain(subdomain: string): Promise<Region> {
    const region = await this.regionModel.findOne({ subdomain, isActive: true });
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    return region;
  }

  async update(id: string, updateRegionDto: UpdateRegionDto, user?: any): Promise<Region> {
    const region = await this.regionModel.findOne({ _id: id });
    if (!region) {
      throw new NotFoundException('Region not found');
    }

    // Scope validation for non-platform roles
    if (user && !PLATFORM_ROLES.includes(user.role)) {
      await this.validateUserScope(user, id);
    }

    Object.assign(region, updateRegionDto);
    await region.save();

    return region;
  }

  async remove(id: string, user?: any): Promise<void> {
    // Check if region has children
    const hasChildren = await this.regionModel.countDocuments({ parentId: id });
    if (hasChildren > 0) {
      throw new BadRequestException('Cannot delete region with children');
    }

    const region = await this.regionModel.findOne({ _id: id });
    if (!region) {
      throw new NotFoundException('Region not found');
    }

    // Scope validation for non-platform roles
    if (user && !PLATFORM_ROLES.includes(user.role)) {
      await this.validateUserScope(user, id);
    }

    await this.regionModel.deleteOne({ _id: id });
  }

  // Get scoped tree based on user role
  async getMyTree(user: any): Promise<any> {
    if (PLATFORM_ROLES.includes(user.role)) {
      return this.getHierarchyTree();
    }

    if (DESA_ROLES.includes(user.role)) {
      // Find desa region matching user's desa
      const desaRegion = await this.regionModel.findOne({
        type: RegionType.DESA,
        $or: [
          { name: user.desa },
          { desa: user.desa },
        ],
      });
      if (desaRegion) {
        return this.getHierarchyTree((desaRegion as any)._id);
      }
      return [];
    }

    if (RW_ROLES.includes(user.role)) {
      // Find RW region matching user's desa + rw
      const rwRegion = await this.regionModel.findOne({
        type: RegionType.RW,
        $or: [
          { name: user.rw, desa: user.desa },
          { rw: user.rw, desa: user.desa },
        ],
      });
      if (rwRegion) {
        return this.getHierarchyTree((rwRegion as any)._id);
      }
      return [];
    }

    if (RT_ROLES.includes(user.role)) {
      // Find RT region matching user's desa + rw + rt
      const rtRegion = await this.regionModel.findOne({
        type: RegionType.RT,
        $or: [
          { name: user.rt, rw: user.rw, desa: user.desa },
          { rt: user.rt, rw: user.rw, desa: user.desa },
        ],
      });
      if (rtRegion) {
        const obj = (rtRegion as any).toObject();
        return { ...obj, children: [] };
      }
      return [];
    }

    return [];
  }

  // Get full hierarchy tree
  async getHierarchyTree(regionId?: string): Promise<any> {
    const regions = await this.regionModel.find().sort({ name: 1 }).exec();

    const buildTree = (parentId: string | null): any[] => {
      return regions
        .filter((r: any) => r.parentId === parentId)
        .map((region: any) => {
          return {
            ...region.toObject(),
            children: buildTree(region._id),
          };
        });
    };

    if (regionId) {
      const region: any = await this.findOne(regionId);
      return {
        ...region.toObject(),
        children: buildTree(regionId),
      };
    }

    return buildTree(null);
  }

  // Get parent chain (breadcrumb)
  async getParentChain(regionId: string): Promise<Region[]> {
    const chain: Region[] = [];
    let currentId: string | null | undefined = regionId;

    while (currentId) {
      const region: any = await this.regionModel.findOne({ _id: currentId });
      if (!region) break;
      chain.unshift(region);
      currentId = region.parentId;
    }

    return chain;
  }

  // Get children regions
  async getChildren(parentId: string, type?: RegionType): Promise<Region[]> {
    const filter: any = { parentId };
    if (type) filter.type = type;

    return this.regionModel.find(filter).sort({ name: 1 }).exec();
  }

  // Update statistics
  async updateStatistics(regionId: string, totalCitizens: number, totalFamilies: number): Promise<void> {
    const region = await this.regionModel.findOne({ _id: regionId });
    if (region) {
      region.totalCitizens = totalCitizens;
      region.totalFamilies = totalFamilies;
      await region.save();
    }
  }

  // ── AdminDesa: My Desa methods ──

  async getMyDesa(user: any): Promise<RegionDocument> {
    const region = await this.regionModel.findOne({
      type: RegionType.DESA,
      $or: [
        { _id: user.regionId },
        { name: user.desa },
      ],
    });
    if (!region) throw new NotFoundException('Desa tidak ditemukan');
    return region;
  }

  async updateMyDesa(dto: UpdateRegionDto, user: any): Promise<RegionDocument> {
    const region = await this.getMyDesa(user);
    // Only allow updating profile fields, not type/parentId
    const allowed = ['name', 'address', 'postalCode', 'phone', 'email', 'leaderName', 'leaderPhone', 'description', 'provinsi', 'kabupaten', 'kecamatan'];
    for (const key of allowed) {
      if ((dto as any)[key] !== undefined) {
        (region as any)[key] = (dto as any)[key];
      }
    }
    await region.save();
    return region;
  }

  async updateMyDesaLanding(body: UpdateDesaLandingDto, user: any): Promise<RegionDocument> {
    const region = await this.getMyDesa(user);
    region.landingConfig = {
      ...(region.landingConfig || {}),
      ...body,
    };
    await region.save();
    return region;
  }

  async uploadDesaImage(user: any, field: 'logoUrl' | 'bannerUrl', file: Express.Multer.File): Promise<RegionDocument> {
    if (!file) throw new BadRequestException('File tidak ditemukan');
    const region = await this.getMyDesa(user);
    (region as any)[field] = (file as any).location;
    await region.save();
    return region;
  }

  // ── Public landing page ──

  async getPublicLanding(subdomain: string): Promise<any> {
    const region = await this.regionModel.findOne({ subdomain, isActive: true });
    if (!region) throw new NotFoundException('Desa tidak ditemukan');

    return {
      name: region.name,
      description: region.description,
      address: region.address,
      provinsi: region.provinsi,
      kabupaten: region.kabupaten,
      kecamatan: region.kecamatan,
      phone: region.phone,
      email: region.email,
      leaderName: region.leaderName,
      logoUrl: region.logoUrl,
      bannerUrl: region.bannerUrl,
      subdomain: region.subdomain,
      landingConfig: region.landingConfig,
      totalCitizens: region.totalCitizens,
      totalFamilies: region.totalFamilies,
    };
  }

  // Validate hierarchy rules
  private validateHierarchy(childType: RegionType, parentType: RegionType): void {
    const validHierarchy: Record<RegionType, RegionType[]> = {
      [RegionType.PROVINSI]: [],
      [RegionType.KABUPATEN]: [RegionType.PROVINSI],
      [RegionType.KECAMATAN]: [RegionType.KABUPATEN],
      [RegionType.DESA]: [RegionType.KECAMATAN],
      [RegionType.RW]: [RegionType.DESA],
      [RegionType.RT]: [RegionType.RW],
    };

    const allowedParents = validHierarchy[childType];
    if (!allowedParents.includes(parentType)) {
      throw new BadRequestException(
        `Invalid hierarchy: ${childType} cannot have ${parentType} as parent`,
      );
    }
  }

  // Validate what a non-platform user can create
  private validateCreateScope(dto: CreateRegionDto, user: any): void {
    if (DESA_ROLES.includes(user.role)) {
      // KepalaDesa/SekretarisDesa can only create RW or RT
      if (dto.type !== RegionType.RW && dto.type !== RegionType.RT) {
        throw new ForbiddenException('Anda hanya dapat membuat wilayah RW atau RT');
      }
    } else if (RW_ROLES.includes(user.role)) {
      // KetuaRW/AdminRW can only create RT
      if (dto.type !== RegionType.RT) {
        throw new ForbiddenException('Anda hanya dapat membuat wilayah RT');
      }
    } else if (RT_ROLES.includes(user.role)) {
      // KetuaRT/AdminRT cannot create any child (RT is leaf node)
      throw new ForbiddenException('RT adalah level terbawah, tidak dapat membuat sub-wilayah');
    } else {
      throw new ForbiddenException('Anda tidak memiliki akses untuk membuat wilayah');
    }
  }

  // Validate that user has scope access to a region
  private async validateUserScope(user: any, regionId: string): Promise<void> {
    const chain = await this.getParentChain(regionId);
    if (chain.length === 0) {
      throw new NotFoundException('Region not found');
    }

    if (DESA_ROLES.includes(user.role)) {
      // Check that the chain contains a Desa matching user's desa
      const hasDesa = chain.some(
        (r: any) => r.type === RegionType.DESA && (r.name === user.desa || r.desa === user.desa),
      );
      if (!hasDesa) {
        throw new ForbiddenException('Anda tidak memiliki akses ke wilayah ini');
      }
      return;
    }

    if (RW_ROLES.includes(user.role)) {
      // Check that the chain contains an RW matching user's desa + rw
      const hasRW = chain.some(
        (r: any) =>
          r.type === RegionType.RW &&
          (r.name === user.rw || r.rw === user.rw) &&
          // Also verify desa matches by checking parent chain
          chain.some((d: any) => d.type === RegionType.DESA && (d.name === user.desa || d.desa === user.desa)),
      );
      if (!hasRW) {
        throw new ForbiddenException('Anda tidak memiliki akses ke wilayah ini');
      }
      return;
    }

    if (RT_ROLES.includes(user.role)) {
      // KetuaRT/AdminRT can only access their own RT
      const target: any = chain[chain.length - 1];
      const isOwnRT =
        target.type === RegionType.RT &&
        (target.name === user.rt || target.rt === user.rt) &&
        chain.some((r: any) => r.type === RegionType.RW && (r.name === user.rw || r.rw === user.rw)) &&
        chain.some((r: any) => r.type === RegionType.DESA && (r.name === user.desa || r.desa === user.desa));
      if (!isOwnRT) {
        throw new ForbiddenException('Anda hanya dapat mengelola RT Anda sendiri');
      }
      return;
    }

    throw new ForbiddenException('Anda tidak memiliki akses untuk mengelola wilayah');
  }
}
