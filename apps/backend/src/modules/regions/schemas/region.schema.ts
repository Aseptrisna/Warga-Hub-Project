import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type RegionDocument = HydratedDocument<Region>;

export enum RegionType {
  PROVINSI = 'Provinsi',
  KABUPATEN = 'Kabupaten',
  KECAMATAN = 'Kecamatan',
  DESA = 'Desa',
  RW = 'RW',
  RT = 'RT',
}

@Schema()
export class Region extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(RegionType) })
  type: RegionType;

  @Prop({ type: String, default: null })
  parentId?: string; // ID of parent region (hierarchical)

  @Prop()
  code?: string; // Kode wilayah (ex: 32.01.05.2001)

  // Alamat lengkap untuk Desa/RW/RT
  @Prop()
  provinsi?: string;

  @Prop()
  kabupaten?: string;

  @Prop()
  kecamatan?: string;

  @Prop()
  desa?: string;

  @Prop()
  rw?: string;

  @Prop()
  rt?: string;

  // Kontak wilayah
  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  address?: string;

  @Prop()
  postalCode?: string;

  // Data kepemimpinan
  @Prop()
  leaderName?: string; // Nama Kepala Desa / Ketua RW / Ketua RT

  @Prop()
  leaderPhone?: string;

  // Statistik
  @Prop({ default: 0 })
  totalCitizens?: number;

  @Prop({ default: 0 })
  totalFamilies?: number;

  // Logo & Branding
  @Prop()
  logoUrl?: string;

  @Prop()
  bannerUrl?: string;

  // Landing page settings
  @Prop()
  subdomain?: string; // ex: desa-sukamaju, rw05, rt03

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  landingConfig?: {
    heroTitle?: string;
    heroSubtitle?: string;
    aboutText?: string;
    features?: string[];
    contactPhone?: string;
    contactEmail?: string;
    socialMedia?: Record<string, string>;
  };

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional custom data
}

export const RegionSchema = SchemaFactory.createForClass(Region);

// Create indexes
RegionSchema.index({ type: 1 });
RegionSchema.index({ parentId: 1 });
RegionSchema.index({ subdomain: 1 });
RegionSchema.index({ name: 'text' });
