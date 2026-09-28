import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export const UMKM_KATEGORI = ['Kuliner', 'Kerajinan', 'Fashion', 'Pertanian', 'Jasa', 'Lainnya'] as const;
export const UMKM_STATUS = ['Menunggu', 'Disetujui', 'Ditolak'] as const;

export type UmkmDocument = HydratedDocument<Umkm>;

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
export class Umkm extends BaseSchema {
  @Prop({ required: true, trim: true })
  nama: string;

  @Prop({ required: true, enum: UMKM_KATEGORI })
  kategori: string;

  @Prop({ required: true })
  deskripsi: string;

  @Prop({ required: true })
  alamat: string;

  @Prop({ required: true, trim: true })
  noWhatsapp: string;

  @Prop()
  fotoUrl?: string;

  @Prop({ required: true })
  ownerUserId: string;

  @Prop({ required: true })
  ownerName: string;

  @Prop({ required: true })
  desa: string;

  @Prop()
  rw?: string;

  @Prop()
  rt?: string;

  @Prop({ enum: UMKM_STATUS, default: 'Menunggu' })
  status: string;

  @Prop()
  rejectionReason?: string;

  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewedAt?: Date;
}

export const UmkmSchema = SchemaFactory.createForClass(Umkm);

UmkmSchema.index({ desa: 1, status: 1, createdAt: -1 });
UmkmSchema.index({ ownerUserId: 1 });
UmkmSchema.index({ kategori: 1 });
