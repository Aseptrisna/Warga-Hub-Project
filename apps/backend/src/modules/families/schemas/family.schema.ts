import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type FamilyDocument = HydratedDocument<Family>;

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
export class Family extends BaseSchema {
  @Prop({ required: true, unique: true })
  noKk: string; // Nomor Kartu Keluarga (16 digit)

  @Prop({ type: String })
  kepalaKeluargaId?: string; // Reference to Citizen

  @Prop({ required: true })
  kepalaKeluargaNama: string;

  @Prop({ required: true })
  alamat: string;

  @Prop({ required: true })
  rt: string;

  @Prop({ required: true })
  rw: string;

  @Prop({ required: true })
  desa: string;

  @Prop()
  kecamatan?: string;

  @Prop()
  kabupaten?: string;

  @Prop()
  provinsi?: string;

  @Prop({ type: String })
  regionId?: string; // Reference to Region (RT level)

  @Prop({ default: 0 })
  jumlahAnggota: number;

  @Prop()
  kkUrl?: string; // Scan of KK document

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String })
  createdBy?: string; // User ID who created
}

export const FamilySchema = SchemaFactory.createForClass(Family);

FamilySchema.index({ noKk: 1 });
FamilySchema.index({ kepalaKeluargaNama: 'text' });
FamilySchema.index({ rt: 1, rw: 1, desa: 1 });
FamilySchema.index({ regionId: 1 });
