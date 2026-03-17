import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type LetterDocument = HydratedDocument<Letter>;

export enum LetterStatus {
  PENDING_RT = 'pending_rt',
  APPROVED_RT = 'approved_rt',
  REJECTED_RT = 'rejected_rt',
  PENDING_RW = 'pending_rw',
  APPROVED_RW = 'approved_rw',
  REJECTED_RW = 'rejected_rw',
  PENDING_DESA = 'pending_desa',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Letter extends BaseSchema {
  @Prop({ required: true })
  letterNumber: string; // Auto-generated: 001/SKD/RT.01/XII/2026

  @Prop({ type: String, required: true })
  templateId: string; // Reference to LetterTemplate

  @Prop({ required: true })
  templateName: string; // Cached template name

  @Prop({ required: true })
  templateCode: string; // Cached template code (SKD, SKTM, etc.)

  @Prop({ type: String, required: true })
  requestedBy: string; // User ID (warga yang request)

  @Prop({ required: true })
  requestedByName: string; // Cached requester name

  @Prop({ type: String })
  citizenId?: string; // Citizen ID (if applicable)

  @Prop({ type: String })
  regionId?: string; // Region ID (RT level)

  // Letter data (dynamic fields based on template)
  @Prop({ type: Object, required: true })
  data: Record<string, any>; // {nama, nik, alamat, keperluan, etc.}

  // Workflow status
  @Prop({ required: true, enum: Object.values(LetterStatus), default: LetterStatus.PENDING_RT })
  status: LetterStatus;

  // Approval chain
  @Prop({ type: String })
  approvedByRT?: string; // RT User ID

  @Prop()
  approvedByRTName?: string;

  @Prop()
  approvedAtRT?: Date;

  @Prop()
  rtNotes?: string;

  @Prop({ type: String })
  approvedByRW?: string; // RW User ID

  @Prop()
  approvedByRWName?: string;

  @Prop()
  approvedAtRW?: Date;

  @Prop()
  rwNotes?: string;

  @Prop({ type: String })
  approvedByDesa?: string; // Desa User ID

  @Prop()
  approvedByDesaName?: string;

  @Prop()
  approvedAtDesa?: Date;

  @Prop()
  desaNotes?: string;

  // Rejection
  @Prop({ type: String })
  rejectedBy?: string;

  @Prop()
  rejectedByName?: string;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  rejectionReason?: string;

  // PDF generation
  @Prop()
  pdfUrl?: string; // URL to generated PDF

  @Prop()
  qrCode?: string; // QR code data for verification

  @Prop()
  generatedAt?: Date; // When PDF was generated

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const LetterSchema = SchemaFactory.createForClass(Letter);

// Indexes
LetterSchema.index({ letterNumber: 1 });
LetterSchema.index({ templateId: 1 });
LetterSchema.index({ requestedBy: 1 });
LetterSchema.index({ citizenId: 1 });
LetterSchema.index({ regionId: 1 });
LetterSchema.index({ status: 1 });
LetterSchema.index({ createdAt: -1 });
