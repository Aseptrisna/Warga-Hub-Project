import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  async log(data: {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    module: string;
    entityId?: string;
    entityType?: string;
    description: string;
    changes?: Record<string, any>;
    ipAddress?: string;
  }) {
    const log = new this.auditLogModel(data);
    await log.save();
    return log;
  }

  async findAll(query?: any) {
    const {
      page = 1,
      limit = 20,
      search,
      action,
      module,
      userId,
      startDate,
      endDate,
    } = query || {};

    const filter: any = {};

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
      ];
    }

    if (action) filter.action = action;
    if (module) filter.module = module;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await this.auditLogModel.countDocuments(filter);
    const logs = await this.auditLogModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data: logs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEntity(entityId: string, entityType?: string) {
    const filter: any = { entityId };
    if (entityType) filter.entityType = entityType;

    return this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async getStatistics() {
    const [byAction, byModule, recentActivity] = await Promise.all([
      this.auditLogModel.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.auditLogModel.aggregate([
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.auditLogModel.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
    ]);

    const total = await this.auditLogModel.countDocuments();

    return {
      total,
      last24h: recentActivity[0]?.count || 0,
      byAction,
      byModule,
    };
  }
}
