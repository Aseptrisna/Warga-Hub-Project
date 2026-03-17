import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    module?: string;
    referenceId?: string;
    referenceUrl?: string;
  }) {
    const notification = new this.notificationModel(data);
    await notification.save();
    return notification;
  }

  async findAllForUser(userId: string, query?: any) {
    const { page = 1, limit = 20, isRead } = query || {};

    const filter: any = { userId };
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const total = await this.notificationModel.countDocuments(filter);
    const notifications = await this.notificationModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data: notifications,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({ userId, isRead: false });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findOne({ _id: id, userId });
    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return {
      message: 'Notifikasi ditandai sudah dibaca',
      data: notification,
    };
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );

    return {
      message: 'Semua notifikasi ditandai sudah dibaca',
    };
  }

  async notifyByRole(
    roles: string[],
    data: {
      title: string;
      message: string;
      type?: string;
      module?: string;
      referenceId?: string;
      referenceUrl?: string;
    },
    filter?: { desa?: string; rw?: string; rt?: string },
  ) {
    const userFilter: any = { role: { $in: roles }, isActive: true };
    if (filter?.desa) userFilter.desa = filter.desa;
    if (filter?.rw) userFilter.rw = filter.rw;
    if (filter?.rt) userFilter.rt = filter.rt;

    const users = await this.userModel.find(userFilter).select('_id').lean();

    const notifications = users.map((user) => ({
      userId: user._id,
      ...data,
    }));

    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
  }
}
