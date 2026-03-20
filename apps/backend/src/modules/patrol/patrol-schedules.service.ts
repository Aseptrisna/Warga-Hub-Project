import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PatrolSchedule, PatrolScheduleDocument, PatrolStatus } from './schemas/patrol-schedule.schema';
import { CreatePatrolScheduleDto, UpdatePatrolScheduleDto } from './dto/create-patrol-schedule.dto';

@Injectable()
export class PatrolSchedulesService {
  constructor(
    @InjectModel(PatrolSchedule.name) private scheduleModel: Model<PatrolScheduleDocument>,
  ) {}

  async create(createDto: CreatePatrolScheduleDto): Promise<PatrolSchedule> {
    const schedule = new this.scheduleModel({
      ...createDto,
      date: new Date(createDto.date),
      status: PatrolStatus.SCHEDULED,
      completedCheckpoints: 0,
    });

    return schedule.save();
  }

  async findAll(query?: {
    regionId?: string;
    status?: PatrolStatus;
    date?: string;
    startDate?: string;
    endDate?: string;
    assignedOfficer?: string;
    desa?: string;
    rw?: string;
    rt?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: PatrolSchedule[]; meta: any }> {
    const { regionId, status, date, startDate, endDate, assignedOfficer, desa, rw, rt, page = 1, limit = 50 } = query || {};
    const filter: any = {};

    if (regionId) filter.regionId = regionId;
    if (status) filter.status = status;
    if (assignedOfficer) filter.assignedOfficers = assignedOfficer;
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const total = await this.scheduleModel.countDocuments(filter);
    const data = await this.scheduleModel
      .find(filter)
      .sort({ date: -1, shift: 1 })
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

  async findOne(id: string): Promise<PatrolSchedule> {
    const schedule = await this.scheduleModel.findOne({ _id: id });
    if (!schedule) {
      throw new NotFoundException('Patrol schedule not found');
    }
    return schedule;
  }

  async update(id: string, updateDto: UpdatePatrolScheduleDto): Promise<PatrolSchedule> {
    const schedule = await this.scheduleModel.findOne({ _id: id });
    if (!schedule) {
      throw new NotFoundException('Patrol schedule not found');
    }

    const updateData: any = { ...updateDto };
    if (updateDto.date) {
      updateData.date = new Date(updateDto.date);
    }

    Object.assign(schedule, updateData);
    await schedule.save();

    return schedule;
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);

    if (schedule.status === PatrolStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete in-progress patrol');
    }

    await this.scheduleModel.deleteOne({ _id: id });
  }

  // Start patrol
  async startPatrol(id: string): Promise<PatrolSchedule> {
    const schedule = await this.scheduleModel.findOne({ _id: id });
    if (!schedule) {
      throw new NotFoundException('Patrol schedule not found');
    }

    if (schedule.status !== PatrolStatus.SCHEDULED) {
      throw new BadRequestException('Patrol already started or completed');
    }

    schedule.status = PatrolStatus.IN_PROGRESS;
    schedule.startTime = new Date();

    return schedule.save();
  }

  // Complete patrol
  async completePatrol(id: string, reportSummary?: string): Promise<PatrolSchedule> {
    const schedule = await this.scheduleModel.findOne({ _id: id });
    if (!schedule) {
      throw new NotFoundException('Patrol schedule not found');
    }

    if (schedule.status !== PatrolStatus.IN_PROGRESS) {
      throw new BadRequestException('Patrol is not in progress');
    }

    schedule.status = PatrolStatus.COMPLETED;
    schedule.endTime = new Date();
    if (reportSummary) {
      schedule.reportSummary = reportSummary;
    }

    return schedule.save();
  }

  // Cancel patrol
  async cancelPatrol(id: string, reason?: string): Promise<PatrolSchedule> {
    const schedule = await this.scheduleModel.findOne({ _id: id });
    if (!schedule) {
      throw new NotFoundException('Patrol schedule not found');
    }

    if (schedule.status === PatrolStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed patrol');
    }

    schedule.status = PatrolStatus.CANCELLED;
    if (reason) {
      schedule.notes = (schedule.notes || '') + `\nCancelled: ${reason}`;
    }

    return schedule.save();
  }

  // Update checkpoint progress
  async updateCheckpointProgress(id: string, completedCount: number): Promise<void> {
    const schedule = await this.scheduleModel.findOne({ _id: id });
    if (schedule) {
      schedule.completedCheckpoints = completedCount;
      await schedule.save();
    }
  }

  // Get upcoming patrols for an officer
  async getUpcomingPatrols(officerId: string): Promise<PatrolSchedule[]> {
    const now = new Date();
    return this.scheduleModel
      .find({
        assignedOfficers: officerId,
        date: { $gte: now },
        status: { $in: [PatrolStatus.SCHEDULED, PatrolStatus.IN_PROGRESS] },
      })
      .sort({ date: 1 })
      .limit(10)
      .exec();
  }

  // Get patrol statistics
  async getStatistics(query?: { regionId?: string; desa?: string; rw?: string; rt?: string; startDate?: string; endDate?: string }): Promise<any> {
    const { regionId, desa, rw, rt, startDate, endDate } = query || {};
    const filter: any = {};

    if (regionId) filter.regionId = regionId;
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [total, completed, inProgress, scheduled, cancelled] = await Promise.all([
      this.scheduleModel.countDocuments(filter),
      this.scheduleModel.countDocuments({ ...filter, status: PatrolStatus.COMPLETED }),
      this.scheduleModel.countDocuments({ ...filter, status: PatrolStatus.IN_PROGRESS }),
      this.scheduleModel.countDocuments({ ...filter, status: PatrolStatus.SCHEDULED }),
      this.scheduleModel.countDocuments({ ...filter, status: PatrolStatus.CANCELLED }),
    ]);

    return {
      total,
      completed,
      inProgress,
      scheduled,
      cancelled,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
    };
  }
}
