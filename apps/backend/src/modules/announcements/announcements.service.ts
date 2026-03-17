import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Announcement } from './schemas/announcement.schema';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name) private announcementModel: Model<Announcement>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(data: any, userId: string, userName: string) {
    const announcement = new this.announcementModel({
      ...data,
      createdBy: userId,
      createdByName: userName,
    });
    await announcement.save();

    this.auditService.log({
      userId,
      userName,
      action: 'CREATE',
      module: 'announcements',
      entityId: announcement._id,
      entityType: 'Announcement',
      description: `Membuat pengumuman: ${data.judul}`,
    });

    // Notify all users about new announcement
    this.notificationsService.notifyByRole(
      ['Warga', 'KetuaRT', 'AdminRT', 'KetuaRW', 'AdminRW', 'KepalaDesa', 'SekretarisDesa'],
      {
        title: 'Pengumuman Baru',
        message: `${data.judul}`,
        type: 'info',
        module: 'announcements',
        referenceId: announcement._id,
        referenceUrl: `/announcements/${announcement._id}`,
      },
    );

    return { message: 'Pengumuman berhasil dibuat', data: announcement };
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, search, desa, rw, rt } = query;
    const filter: any = { isActive: true };

    if (search) {
      filter.$or = [
        { judul: { $regex: search, $options: 'i' } },
        { isi: { $regex: search, $options: 'i' } },
      ];
    }

    if (desa) filter.targetDesa = desa;
    if (rw) filter.targetRW = rw;
    if (rt) filter.targetRT = rt;

    const total = await this.announcementModel.countDocuments(filter);
    const announcements = await this.announcementModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ isPinned: -1, createdAt: -1 })
      .exec();

    return {
      data: announcements,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const announcement = await this.announcementModel.findOne({ _id: id });
    if (!announcement) {
      throw new NotFoundException('Pengumuman tidak ditemukan');
    }
    return announcement;
  }

  async update(id: string, data: any, user?: any) {
    const announcement = await this.findOne(id);
    Object.assign(announcement, data);
    await announcement.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'UPDATE',
      module: 'announcements',
      entityId: announcement._id,
      entityType: 'Announcement',
      description: `Memperbarui pengumuman: ${announcement.judul}`,
      changes: data,
    });

    return { message: 'Pengumuman berhasil diperbarui', data: announcement };
  }

  async togglePin(id: string) {
    const announcement = await this.findOne(id);
    announcement.isPinned = !announcement.isPinned;
    await announcement.save();
    return { message: `Pengumuman ${announcement.isPinned ? 'di-pin' : 'unpin'}`, data: announcement };
  }

  async remove(id: string, user?: any) {
    const announcement = await this.announcementModel.findOne({ _id: id });
    if (!announcement) {
      throw new NotFoundException('Pengumuman tidak ditemukan');
    }
    await this.announcementModel.deleteOne({ _id: id });

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'DELETE',
      module: 'announcements',
      entityId: id,
      entityType: 'Announcement',
      description: `Menghapus pengumuman: ${announcement.judul}`,
    });

    return { message: 'Pengumuman berhasil dihapus' };
  }
}
