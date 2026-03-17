import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type PatrolCheckpointDocument = HydratedDocument<PatrolCheckpoint>;

@Schema({ timestamps: true, versionKey: false })
export class PatrolCheckpoint extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  code: string; // Unique code (e.g., "CP-RT01-001")

  @Prop()
  description?: string;

  @Prop({ type: String, required: true })
  regionId: string; // RT/RW/Desa

  @Prop()
  regionName?: string;

  // Location
  @Prop({ required: true })
  address: string;

  @Prop({ type: Object })
  location?: {
    type: string; // 'Point'
    coordinates: [number, number]; // [longitude, latitude]
  };

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  // GPS validation radius (in meters)
  @Prop({ default: 50 })
  validationRadius: number;

  // QR Code
  @Prop({ required: true })
  qrCode: string; // Base64 QR code image

  @Prop({ required: true })
  qrCodeData: string; // Data embedded in QR (checkpoint ID + security token)

  // Status
  @Prop({ default: true })
  isActive: boolean;

  // Statistics
  @Prop({ default: 0 })
  totalScans: number;

  @Prop()
  lastScannedAt?: Date;

  @Prop()
  lastScannedBy?: string;

  @Prop()
  lastScannedByName?: string;

  // Additional info
  @Prop()
  photoUrl?: string; // Photo of the checkpoint location

  @Prop()
  notes?: string;
}

export const PatrolCheckpointSchema = SchemaFactory.createForClass(PatrolCheckpoint);

// Create geospatial index for location queries
PatrolCheckpointSchema.index({ location: '2dsphere' });
