import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type AnnouncementDocument = HydratedDocument<Announcement>;

@Schema()
export class Announcement extends BaseSchema {
  @Prop({ required: true })
  judul: string;

  @Prop({ required: true })
  isi: string;

  @Prop({ required: true, enum: ['Umum', 'Penting', 'Mendesak'] })
  kategori: string;

  @Prop()
  gambar?: string;

  @Prop({ type: String })
  targetDesa?: string;

  @Prop({ type: String })
  targetRW?: string;

  @Prop({ type: String })
  targetRT?: string;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ required: true })
  createdBy: string; // User ID

  @Prop()
  createdByName: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

AnnouncementSchema.index({ judul: 'text', isi: 'text' });
AnnouncementSchema.index({ targetDesa: 1, targetRW: 1, targetRT: 1 });
AnnouncementSchema.index({ isPinned: -1, createdAt: -1 });
