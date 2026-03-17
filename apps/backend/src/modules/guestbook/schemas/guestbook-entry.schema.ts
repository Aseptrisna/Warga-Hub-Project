import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type GuestbookEntryDocument = HydratedDocument<GuestbookEntry>;

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
export class GuestbookEntry extends BaseSchema {
  @Prop({ required: true })
  namaTamu: string;

  @Prop()
  nik?: string;

  @Prop()
  noTelp?: string;

  @Prop()
  alamatAsal?: string;

  @Prop({ required: true })
  tujuan: string;

  @Prop()
  yangDitemui?: string;

  @Prop({ required: true })
  waktuMasuk: Date;

  @Prop()
  waktuKeluar?: Date;

  @Prop()
  fotoUrl?: string;

  @Prop({ required: true })
  desa: string;

  @Prop()
  rw?: string;

  @Prop()
  rt?: string;

  @Prop({ type: String })
  regionId?: string;

  @Prop({ default: 'Masuk', enum: ['Masuk', 'Keluar'] })
  status: string;

  @Prop({ type: String })
  createdBy?: string;

  @Prop()
  createdByName?: string;
}

export const GuestbookEntrySchema = SchemaFactory.createForClass(GuestbookEntry);

GuestbookEntrySchema.index({ desa: 1, rt: 1, rw: 1 });
GuestbookEntrySchema.index({ status: 1 });
GuestbookEntrySchema.index({ waktuMasuk: -1 });
GuestbookEntrySchema.index({ namaTamu: 'text' });
