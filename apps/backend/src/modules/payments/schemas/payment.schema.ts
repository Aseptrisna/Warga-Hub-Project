import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type PaymentDocument = HydratedDocument<Payment>;

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
export class Payment extends BaseSchema {
  @Prop({ required: true })
  citizenId: string;

  @Prop({ required: true })
  citizenName: string;

  @Prop({ required: true })
  nik: string;

  @Prop({ required: true })
  rt: string;

  @Prop({ required: true })
  rw: string;

  @Prop({ required: true })
  desa: string;

  // Legacy field - kept for backward compatibility
  @Prop()
  jenis?: string;

  // New: reference to IuranType
  @Prop({ required: true })
  iuranTypeId: string;

  @Prop({ required: true })
  iuranTypeName: string;

  @Prop({ required: true })
  jumlah: number;

  @Prop({ required: true })
  bulan: number; // 1-12

  @Prop({ required: true })
  tahun: number;

  @Prop({ required: true, enum: ['Belum Bayar', 'Menunggu Verifikasi', 'Lunas', 'Ditolak'], default: 'Belum Bayar' })
  status: string;

  @Prop({ default: 0 })
  jumlahDibayar: number;

  @Prop()
  tanggalBayar?: Date;

  @Prop()
  metodeBayar?: string;

  @Prop()
  buktiBayarUrl?: string;

  @Prop()
  keterangan?: string;

  @Prop()
  verifiedBy?: string;

  @Prop()
  verifiedByName?: string;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  createdBy: string;

  @Prop()
  createdByName: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ citizenId: 1, iuranTypeId: 1, bulan: 1, tahun: 1 }, { unique: true });
PaymentSchema.index({ rt: 1, rw: 1, desa: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ iuranTypeId: 1 });
