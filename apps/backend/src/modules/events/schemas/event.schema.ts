import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type EventDocument = HydratedDocument<Event>;

export enum EventCategory {
  KERJA_BAKTI = 'Kerja Bakti',
  RAPAT = 'Rapat',
  PERAYAAN = 'Perayaan',
  OLAHRAGA = 'Olahraga',
  SOSIAL = 'Sosial',
  LAINNYA = 'Lainnya',
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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
export class Event extends BaseSchema {
  @Prop({ required: true })
  namaAcara: string;

  @Prop({ required: true })
  deskripsi: string;

  @Prop({ required: true, enum: EventCategory })
  kategori: string;

  @Prop({ required: true })
  tanggalMulai: Date;

  @Prop({ required: true })
  tanggalSelesai: Date;

  @Prop({ required: true })
  lokasi: string;

  @Prop({ required: true })
  penyelenggaraId: string;

  @Prop({ required: true })
  penyelenggaraName: string;

  @Prop({ type: [{ userId: String, userName: String, registeredAt: Date }], default: [] })
  peserta: { userId: string; userName: string; registeredAt: Date }[];

  @Prop({ default: 0 })
  kapasitas: number;

  @Prop({ default: EventStatus.UPCOMING, enum: EventStatus })
  status: string;

  @Prop({ type: String })
  desa?: string;

  @Prop({ type: String })
  rw?: string;

  @Prop({ type: String })
  rt?: string;

  @Prop()
  gambar?: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ status: 1, tanggalMulai: -1 });
EventSchema.index({ kategori: 1 });
