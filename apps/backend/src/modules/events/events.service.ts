import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from './schemas/event.schema';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(data: any, userId: string, userName: string) {
    const event = new this.eventModel({
      ...data,
      penyelenggaraId: userId,
      penyelenggaraName: userName,
      status: EventStatus.UPCOMING,
    });
    await event.save();

    this.auditService.log({
      userId,
      userName,
      action: 'CREATE',
      module: 'events',
      entityId: event._id,
      entityType: 'Event',
      description: `Membuat event: ${data.namaAcara}`,
    });

    // Notify all warga about new event
    this.notificationsService.notifyByRole(
      ['Warga'],
      {
        title: 'Event Baru',
        message: `Event baru: ${data.namaAcara}`,
        type: 'info',
        module: 'events',
        referenceId: event._id,
        referenceUrl: `/events/${event._id}`,
      },
    );

    return { message: 'Event berhasil dibuat', data: event };
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, search, kategori, status, desa } = query || {};
    const filter: any = {};

    if (search) {
      filter.$or = [
        { namaAcara: { $regex: search, $options: 'i' } },
        { deskripsi: { $regex: search, $options: 'i' } },
      ];
    }
    if (kategori) filter.kategori = kategori;
    if (status) filter.status = status;
    if (desa) filter.desa = desa;

    const total = await this.eventModel.countDocuments(filter);
    const events = await this.eventModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ tanggalMulai: -1 })
      .exec();

    return {
      data: events,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const event = await this.eventModel.findOne({ _id: id });
    if (!event) throw new NotFoundException('Event tidak ditemukan');
    return event;
  }

  async update(id: string, data: any, user?: any) {
    const event = await this.findOne(id);
    const allowed = ['namaAcara', 'deskripsi', 'kategori', 'tanggalMulai', 'tanggalSelesai', 'lokasi', 'kapasitas', 'status', 'gambar'];
    for (const key of allowed) {
      if (data[key] !== undefined) (event as any)[key] = data[key];
    }
    await event.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'UPDATE',
      module: 'events',
      entityId: event._id,
      entityType: 'Event',
      description: `Memperbarui event: ${event.namaAcara}`,
      changes: data,
    });

    return { message: 'Event berhasil diperbarui', data: event };
  }

  async register(eventId: string, userId: string, userName: string) {
    const event = await this.findOne(eventId);
    if (event.status !== EventStatus.UPCOMING) throw new BadRequestException('Event tidak menerima pendaftaran');
    if (event.kapasitas > 0 && event.peserta.length >= event.kapasitas) throw new BadRequestException('Event sudah penuh');
    const exists = event.peserta.find((p: any) => p.userId === userId);
    if (exists) throw new BadRequestException('Sudah terdaftar');

    event.peserta.push({ userId, userName, registeredAt: new Date() });
    await event.save();
    return { message: 'Berhasil mendaftar event', data: event };
  }

  async unregister(eventId: string, userId: string) {
    const event = await this.findOne(eventId);
    event.peserta = event.peserta.filter((p: any) => p.userId !== userId);
    await event.save();
    return { message: 'Berhasil membatalkan pendaftaran', data: event };
  }

  async getStatistics(filter?: any) {
    const match: any = {};
    if (filter?.desa) match.desa = filter.desa;

    const [total, upcoming, ongoing, completed] = await Promise.all([
      this.eventModel.countDocuments(match),
      this.eventModel.countDocuments({ ...match, status: EventStatus.UPCOMING }),
      this.eventModel.countDocuments({ ...match, status: EventStatus.ONGOING }),
      this.eventModel.countDocuments({ ...match, status: EventStatus.COMPLETED }),
    ]);

    return { total, upcoming, ongoing, completed };
  }

  async remove(id: string, user?: any) {
    const event = await this.eventModel.findOne({ _id: id });
    if (!event) throw new NotFoundException('Event tidak ditemukan');
    await this.eventModel.deleteOne({ _id: id });

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'DELETE',
      module: 'events',
      entityId: id,
      entityType: 'Event',
      description: `Menghapus event: ${event.namaAcara}`,
    });

    return { message: 'Event berhasil dihapus' };
  }
}
