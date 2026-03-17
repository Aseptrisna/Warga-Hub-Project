import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { PatrolCheckpoint, PatrolCheckpointDocument } from './schemas/patrol-checkpoint.schema';
import { CreatePatrolCheckpointDto, UpdatePatrolCheckpointDto } from './dto/create-patrol-checkpoint.dto';
import { QrGenerator } from '../../utils/qr-generator';

@Injectable()
export class PatrolCheckpointsService {
  constructor(
    @InjectModel(PatrolCheckpoint.name) private checkpointModel: Model<PatrolCheckpointDocument>,
  ) {}

  async create(createDto: CreatePatrolCheckpointDto): Promise<PatrolCheckpoint> {
    // Generate secure QR code data
    const securityToken = uuidv4();
    const checkpointId = uuidv4();
    const qrCodeData = JSON.stringify({
      checkpointId,
      code: createDto.code,
      token: securityToken,
      type: 'patrol_checkpoint',
    });

    // Generate QR code image
    const qrCode = await QrGenerator.generateQRCode(qrCodeData);

    // Create location object if coordinates provided
    let location;
    if (createDto.latitude && createDto.longitude) {
      location = {
        type: 'Point',
        coordinates: [createDto.longitude, createDto.latitude],
      };
    }

    const checkpoint = new this.checkpointModel({
      _id: checkpointId,
      ...createDto,
      location,
      qrCode,
      qrCodeData,
    });

    return checkpoint.save();
  }

  async findAll(query?: {
    regionId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: PatrolCheckpoint[]; meta: any }> {
    const { regionId, isActive, search, page = 1, limit = 50 } = query || {};
    const filter: any = {};

    if (regionId) filter.regionId = regionId;
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await this.checkpointModel.countDocuments(filter);
    const data = await this.checkpointModel
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

  async findOne(id: string): Promise<PatrolCheckpoint> {
    const checkpoint = await this.checkpointModel.findOne({ _id: id });
    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }
    return checkpoint;
  }

  async findByCode(code: string): Promise<PatrolCheckpoint> {
    const checkpoint = await this.checkpointModel.findOne({ code, isActive: true });
    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }
    return checkpoint;
  }

  async update(id: string, updateDto: UpdatePatrolCheckpointDto): Promise<PatrolCheckpoint> {
    const checkpoint = await this.checkpointModel.findOne({ _id: id });
    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    // Update location if coordinates changed
    const updateData: any = { ...updateDto };
    if (updateDto.latitude !== undefined && updateDto.longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [updateDto.longitude, updateDto.latitude],
      };
    }

    Object.assign(checkpoint, updateData);
    await checkpoint.save();

    return checkpoint;
  }

  async remove(id: string): Promise<void> {
    const checkpoint = await this.checkpointModel.findOne({ _id: id });
    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }
    await this.checkpointModel.deleteOne({ _id: id });
  }

  async regenerateQRCode(id: string): Promise<PatrolCheckpoint> {
    const checkpoint = await this.checkpointModel.findOne({ _id: id });
    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    // Generate new security token
    const securityToken = uuidv4();
    const qrCodeData = JSON.stringify({
      checkpointId: checkpoint._id,
      code: checkpoint.code,
      token: securityToken,
      type: 'patrol_checkpoint',
    });

    const qrCode = await QrGenerator.generateQRCode(qrCodeData);

    checkpoint.qrCode = qrCode;
    checkpoint.qrCodeData = qrCodeData;

    return checkpoint.save();
  }

  // Update scan statistics
  async updateScanStats(id: string, scannedBy: string, scannedByName: string): Promise<void> {
    const checkpoint = await this.checkpointModel.findOne({ _id: id });
    if (checkpoint) {
      checkpoint.totalScans = (checkpoint.totalScans || 0) + 1;
      checkpoint.lastScannedAt = new Date();
      checkpoint.lastScannedBy = scannedBy;
      checkpoint.lastScannedByName = scannedByName;
      await checkpoint.save();
    }
  }

  // Find checkpoints near a location (for mobile app)
  async findNearby(
    longitude: number,
    latitude: number,
    maxDistance: number = 1000, // meters
  ): Promise<PatrolCheckpoint[]> {
    return this.checkpointModel
      .find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      })
      .limit(10)
      .exec();
  }
}
