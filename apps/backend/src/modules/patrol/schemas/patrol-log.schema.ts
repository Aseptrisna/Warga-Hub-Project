import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type PatrolLogDocument = HydratedDocument<PatrolLog>;

export enum ScanStatus {
  VALID = 'valid',
  INVALID_LOCATION = 'invalid_location', // GPS too far from checkpoint
  INVALID_TIME = 'invalid_time', // Outside patrol schedule
  DUPLICATE = 'duplicate', // Already scanned recently
}

@Schema({ timestamps: true, versionKey: false })
export class PatrolLog extends BaseSchema {
  @Prop({ type: String, required: true })
  scheduleId: string; // Patrol schedule ID

  @Prop({ type: String, required: true })
  checkpointId: string; // Checkpoint ID

  @Prop()
  checkpointName?: string;

  @Prop()
  checkpointCode?: string;

  @Prop({ type: String, required: true })
  scannedBy: string; // User ID

  @Prop()
  scannedByName?: string;

  @Prop({ required: true })
  scannedAt: Date;

  // Location data
  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  gpsAccuracy?: number; // GPS accuracy in meters

  @Prop()
  distanceFromCheckpoint?: number; // Distance in meters

  // Validation
  @Prop({ required: true, enum: Object.values(ScanStatus) })
  status: ScanStatus;

  @Prop()
  validationMessage?: string;

  // Evidence
  @Prop()
  photoUrl?: string; // Photo taken during patrol

  @Prop()
  notes?: string;

  // Device info (optional)
  @Prop()
  deviceInfo?: string;

  @Prop()
  userAgent?: string;
}

export const PatrolLogSchema = SchemaFactory.createForClass(PatrolLog);

// Indexes for faster queries
PatrolLogSchema.index({ scheduleId: 1, scannedAt: -1 });
PatrolLogSchema.index({ checkpointId: 1, scannedAt: -1 });
PatrolLogSchema.index({ scannedBy: 1, scannedAt: -1 });
