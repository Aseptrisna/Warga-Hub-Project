import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type PanicAlertDocument = HydratedDocument<PanicAlert>;

export enum EmergencyType {
  KEBAKARAN = 'Kebakaran',
  PENCURIAN = 'Pencurian',
  KESEHATAN = 'Kesehatan',
  KECELAKAAN = 'Kecelakaan',
  BENCANA = 'Bencana Alam',
  LAINNYA = 'Lainnya',
}

export enum PanicStatus {
  ACTIVE = 'active',
  RESPONDED = 'responded',
  RESOLVED = 'resolved',
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
export class PanicAlert extends BaseSchema {
  @Prop({ required: true, enum: EmergencyType })
  tipeEmergency: string;

  @Prop({ required: true })
  pelaporId: string;

  @Prop({ required: true })
  pelaporName: string;

  @Prop({ type: Object })
  lokasi?: {
    alamat?: string;
    lat?: number;
    lng?: number;
  };

  @Prop()
  deskripsi?: string;

  @Prop()
  fotoUrl?: string;

  @Prop({ type: String })
  desa?: string;

  @Prop({ type: String })
  rw?: string;

  @Prop({ type: String })
  rt?: string;

  @Prop({ default: PanicStatus.ACTIVE, enum: PanicStatus })
  status: string;

  @Prop()
  respondedBy?: string;

  @Prop()
  respondedByName?: string;

  @Prop()
  respondedAt?: Date;

  @Prop()
  tindakan?: string;

  @Prop()
  resolvedAt?: Date;
}

export const PanicAlertSchema = SchemaFactory.createForClass(PanicAlert);
PanicAlertSchema.index({ status: 1, createdAt: -1 });
PanicAlertSchema.index({ pelaporId: 1 });
