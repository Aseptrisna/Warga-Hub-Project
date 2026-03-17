import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type ReportDocument = HydratedDocument<Report>;

export enum ReportCategory {
  JALAN_RUSAK = 'Jalan Rusak',
  LAMPU_MATI = 'Lampu Mati',
  SAMPAH = 'Sampah',
  BANJIR = 'Banjir',
  KEAMANAN = 'Keamanan',
  LAINNYA = 'Lainnya',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

@Schema()
export class Report extends BaseSchema {
  @Prop({ required: true })
  judul: string;

  @Prop({ required: true, enum: ReportCategory })
  kategori: string;

  @Prop({ required: true })
  deskripsi: string;

  @Prop({ type: [String], default: [] })
  fotoUrls: string[];

  @Prop({ type: Object })
  lokasi?: {
    alamat?: string;
    lat?: number;
    lng?: number;
  };

  @Prop({ required: true })
  pelaporId: string;

  @Prop({ required: true })
  pelaporName: string;

  @Prop({ type: String })
  desa?: string;

  @Prop({ type: String })
  rw?: string;

  @Prop({ type: String })
  rt?: string;

  @Prop({ default: ReportStatus.PENDING, enum: ReportStatus })
  status: string;

  @Prop()
  tanggapan?: string;

  @Prop()
  respondedBy?: string;

  @Prop()
  respondedByName?: string;

  @Prop()
  respondedAt?: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ kategori: 1 });
ReportSchema.index({ pelaporId: 1 });
