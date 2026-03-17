import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type ExpenseDocument = HydratedDocument<Expense>;

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
export class Expense extends BaseSchema {
  @Prop({ required: true })
  keterangan: string;

  @Prop({ required: true, enum: ['Operasional', 'Infrastruktur', 'Kegiatan', 'Sosial', 'Pendidikan', 'Kesehatan', 'Keamanan', 'Lainnya'] })
  kategori: string;

  @Prop({ required: true })
  jumlah: number;

  @Prop({ required: true })
  tanggalPengeluaran: Date;

  @Prop()
  buktiUrl?: string;

  @Prop()
  penerimaNama?: string;

  @Prop({ required: true })
  desa: string;

  @Prop()
  rw?: string;

  @Prop()
  rt?: string;

  @Prop({ type: String })
  regionId?: string;

  @Prop({ default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] })
  status: string;

  @Prop({ type: String })
  approvedBy?: string; // User ID

  @Prop()
  approvedByName?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: String })
  createdBy?: string;

  @Prop()
  createdByName?: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.index({ desa: 1, rt: 1, rw: 1 });
ExpenseSchema.index({ kategori: 1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ tanggalPengeluaran: -1 });
