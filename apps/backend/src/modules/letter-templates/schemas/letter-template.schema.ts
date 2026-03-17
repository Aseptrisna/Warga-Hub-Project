import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type LetterTemplateDocument = HydratedDocument<LetterTemplate>;

@Schema()
export class LetterTemplate extends BaseSchema {
  @Prop({ required: true })
  name: string; // Nama template (ex: "Surat Keterangan Domisili")

  @Prop({ required: true })
  code: string; // Kode surat (ex: "SKD", "SKTM", "SKCK")

  @Prop({ required: true })
  title: string; // Judul surat yang akan muncul di PDF

  @Prop({ type: String, required: true })
  content: string; // HTML template dengan variable {{nama}}, {{nik}}, etc.

  @Prop()
  description?: string; // Deskripsi template

  @Prop({ type: [String], default: [] })
  requiredFields: string[]; // Fields yang harus diisi (nama, nik, alamat, dll)

  @Prop({ type: Object })
  styles?: Record<string, any>; // Custom CSS styles untuk PDF

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String })
  createdBy?: string; // User ID yang membuat

  @Prop({ type: String })
  regionId?: string; // Template spesifik untuk region tertentu

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional data
}

export const LetterTemplateSchema = SchemaFactory.createForClass(LetterTemplate);

// Indexes
LetterTemplateSchema.index({ code: 1 });
LetterTemplateSchema.index({ regionId: 1 });
LetterTemplateSchema.index({ name: 'text' });
