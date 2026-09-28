import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PatrolLog, PatrolLogDocument, ScanStatus } from './schemas/patrol-log.schema';
import { PatrolSchedule, PatrolScheduleDocument, PatrolStatus } from './schemas/patrol-schedule.schema';
import { PatrolCheckpoint, PatrolCheckpointDocument } from './schemas/patrol-checkpoint.schema';
import { ScanCheckpointDto } from './dto/scan-checkpoint.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatrolLogsService {
  private readonly logger = new Logger(PatrolLogsService.name);

  constructor(
    @InjectModel(PatrolLog.name) private logModel: Model<PatrolLogDocument>,
    @InjectModel(PatrolSchedule.name) private scheduleModel: Model<PatrolScheduleDocument>,
    @InjectModel(PatrolCheckpoint.name) private checkpointModel: Model<PatrolCheckpointDocument>,
    private readonly auditService: AuditService,
  ) {}

  async scanCheckpoint(scanDto: ScanCheckpointDto, user: any): Promise<PatrolLog> {
    // Verify schedule exists and is in progress
    const schedule = await this.scheduleModel.findOne({ _id: scanDto.scheduleId });
    if (!schedule) {
      throw new NotFoundException('Patrol schedule not found');
    }

    if (schedule.status !== PatrolStatus.IN_PROGRESS) {
      throw new BadRequestException('Patrol is not active');
    }

    // Verify checkpoint exists
    const checkpoint = await this.checkpointModel.findOne({ _id: scanDto.checkpointId });
    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    if (!checkpoint.isActive) {
      throw new BadRequestException('Checkpoint is not active');
    }

    // Validate QR code data
    const qrValidation = this.validateQRCode(scanDto.qrCodeData, checkpoint);
    if (!qrValidation.isValid) {
      throw new BadRequestException(qrValidation.message);
    }

    // Check for duplicate scan (within last 15 minutes)
    const recentScan = await this.logModel.findOne({
      scheduleId: scanDto.scheduleId,
      checkpointId: scanDto.checkpointId,
      scannedAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    let status = ScanStatus.VALID;
    let validationMessage = 'Scan successful';
    let distanceFromCheckpoint: number | undefined;

    if (recentScan) {
      status = ScanStatus.DUPLICATE;
      validationMessage = 'Checkpoint already scanned recently';
    } else if (scanDto.latitude && scanDto.longitude && checkpoint.latitude && checkpoint.longitude) {
      // Calculate distance from checkpoint
      distanceFromCheckpoint = this.calculateDistance(
        scanDto.latitude,
        scanDto.longitude,
        checkpoint.latitude,
        checkpoint.longitude,
      );

      // Validate GPS location
      if (distanceFromCheckpoint > checkpoint.validationRadius) {
        status = ScanStatus.INVALID_LOCATION;
        validationMessage = `Too far from checkpoint (${Math.round(distanceFromCheckpoint)}m away, max ${checkpoint.validationRadius}m)`;
      }
    }

    // Create log (copy region scope from schedule)
    const log = new this.logModel({
      scheduleId: scanDto.scheduleId,
      checkpointId: scanDto.checkpointId,
      checkpointName: checkpoint.name,
      checkpointCode: checkpoint.code,
      desa: schedule.desa,
      rw: schedule.rw,
      rt: schedule.rt,
      scannedBy: user.id,
      scannedByName: user.name,
      scannedAt: new Date(),
      latitude: scanDto.latitude,
      longitude: scanDto.longitude,
      gpsAccuracy: scanDto.gpsAccuracy,
      distanceFromCheckpoint,
      status,
      validationMessage,
      photoUrl: scanDto.photoUrl,
      notes: scanDto.notes,
      deviceInfo: scanDto.deviceInfo,
    });

    await log.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE',
      module: 'patrol',
      entityId: log._id,
      entityType: 'PatrolLog',
      description: `Scan checkpoint: ${checkpoint.name} (${status})`,
    });

    // Update checkpoint statistics
    const checkpointToUpdate = await this.checkpointModel.findOne({ _id: scanDto.checkpointId });
    if (checkpointToUpdate) {
      checkpointToUpdate.totalScans = (checkpointToUpdate.totalScans || 0) + 1;
      checkpointToUpdate.lastScannedAt = new Date();
      checkpointToUpdate.lastScannedBy = user.id;
      checkpointToUpdate.lastScannedByName = user.name;
      await checkpointToUpdate.save();
    }

    // Update schedule progress (only count valid scans)
    if (status === ScanStatus.VALID) {
      const completedCount = await this.logModel.countDocuments({
        scheduleId: scanDto.scheduleId,
        status: ScanStatus.VALID,
      });

      const scheduleToUpdate = await this.scheduleModel.findOne({ _id: scanDto.scheduleId });
      if (scheduleToUpdate) {
        scheduleToUpdate.completedCheckpoints = completedCount;
        await scheduleToUpdate.save();
      }
    }

    return log;
  }

  async findAll(query?: {
    scheduleId?: string;
    checkpointId?: string;
    scannedBy?: string;
    status?: ScanStatus;
    startDate?: string;
    endDate?: string;
    desa?: string;
    rw?: string;
    rt?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: PatrolLog[]; meta: any }> {
    const {
      scheduleId,
      checkpointId,
      scannedBy,
      status,
      startDate,
      endDate,
      desa,
      rw,
      rt,
      page = 1,
      limit = 50,
    } = query || {};

    const filter: any = {};

    if (scheduleId) filter.scheduleId = scheduleId;
    if (checkpointId) filter.checkpointId = checkpointId;
    if (scannedBy) filter.scannedBy = scannedBy;
    if (status) filter.status = status;
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;

    if (startDate || endDate) {
      filter.scannedAt = {};
      if (startDate) filter.scannedAt.$gte = new Date(startDate);
      if (endDate) filter.scannedAt.$lte = new Date(endDate);
    }

    const total = await this.logModel.countDocuments(filter);
    const data = await this.logModel
      .find(filter)
      .sort({ scannedAt: -1 })
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

  async findOne(id: string): Promise<PatrolLog> {
    const log = await this.logModel.findOne({ _id: id });
    if (!log) {
      throw new NotFoundException('Patrol log not found');
    }
    return log;
  }

  async getScheduleLogs(scheduleId: string): Promise<PatrolLog[]> {
    return this.logModel.find({ scheduleId }).sort({ scannedAt: 1 }).exec();
  }

  async getOfficerLogs(officerId: string, limit: number = 50): Promise<PatrolLog[]> {
    return this.logModel.find({ scannedBy: officerId }).sort({ scannedAt: -1 }).limit(limit).exec();
  }

  // Calculate distance between two GPS coordinates (in meters)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Validate QR code data
  private validateQRCode(
    scannedData: string,
    checkpoint: PatrolCheckpoint,
  ): { isValid: boolean; message: string } {
    try {
      const data = JSON.parse(scannedData);

      if (data.type !== 'patrol_checkpoint') {
        return { isValid: false, message: 'Invalid QR code type' };
      }

      if (data.checkpointId !== checkpoint._id) {
        return { isValid: false, message: 'QR code does not match checkpoint' };
      }

      if (data.code !== checkpoint.code) {
        return { isValid: false, message: 'Checkpoint code mismatch' };
      }

      // Verify against stored QR data
      if (scannedData !== checkpoint.qrCodeData) {
        return { isValid: false, message: 'QR code validation failed' };
      }

      return { isValid: true, message: 'Valid QR code' };
    } catch (error) {
      this.logger.debug(`QR code validation failed: ${(error as Error).message}`);
      return { isValid: false, message: 'Invalid QR code format' };
    }
  }

  // Get patrol statistics
  async getStatistics(query?: {
    scheduleId?: string;
    checkpointId?: string;
    officerId?: string;
    desa?: string;
    rw?: string;
    rt?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const { scheduleId, checkpointId, officerId, desa, rw, rt, startDate, endDate } = query || {};
    const filter: any = {};

    if (scheduleId) filter.scheduleId = scheduleId;
    if (checkpointId) filter.checkpointId = checkpointId;
    if (officerId) filter.scannedBy = officerId;
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;

    if (startDate || endDate) {
      filter.scannedAt = {};
      if (startDate) filter.scannedAt.$gte = new Date(startDate);
      if (endDate) filter.scannedAt.$lte = new Date(endDate);
    }

    const [total, valid, invalidLocation, invalidTime, duplicate] = await Promise.all([
      this.logModel.countDocuments(filter),
      this.logModel.countDocuments({ ...filter, status: ScanStatus.VALID }),
      this.logModel.countDocuments({ ...filter, status: ScanStatus.INVALID_LOCATION }),
      this.logModel.countDocuments({ ...filter, status: ScanStatus.INVALID_TIME }),
      this.logModel.countDocuments({ ...filter, status: ScanStatus.DUPLICATE }),
    ]);

    return {
      total,
      valid,
      invalidLocation,
      invalidTime,
      duplicate,
      validRate: total > 0 ? ((valid / total) * 100).toFixed(2) : 0,
    };
  }
}
