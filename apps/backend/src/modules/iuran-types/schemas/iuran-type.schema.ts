import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type IuranTypeDocument = HydratedDocument<IuranType>;

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
export class IuranType extends BaseSchema {
  @Prop({ required: true })
  nama: string;

  @Prop({ required: true })
  jumlah: number;

  @Prop({ required: true, enum: ['Bulanan', 'Tahunan', 'Insidental'] })
  periode: string;

  @Prop()
  keterangan?: string;

  @Prop({ required: true })
  desa: string;

  @Prop()
  rw?: string;

  @Prop()
  rt?: string;

  @Prop({ required: true, enum: ['desa', 'rw', 'rt'] })
  scopeLevel: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdBy: string;

  @Prop()
  createdByName: string;
}

export const IuranTypeSchema = SchemaFactory.createForClass(IuranType);

IuranTypeSchema.index({ desa: 1, rw: 1, rt: 1 });
IuranTypeSchema.index({ isActive: 1 });
