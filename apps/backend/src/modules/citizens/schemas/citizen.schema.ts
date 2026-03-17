import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type CitizenDocument = HydratedDocument<Citizen>;

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
export class Citizen extends BaseSchema {
  @Prop({ required: true, unique: true })
  nik: string; // Nomor Induk Kependudukan (16 digit)

  @Prop({ required: true })
  noKk: string; // Nomor Kartu Keluarga (bisa sama untuk 1 keluarga)

  @Prop({ required: true })
  namaLengkap: string;

  @Prop({ required: true, enum: ['Laki-laki', 'Perempuan'] })
  jenisKelamin: string;

  @Prop({ required: true })
  tempatLahir: string;

  @Prop({ required: true })
  tanggalLahir: Date;

  @Prop({ required: true, enum: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'] })
  agama: string;

  @Prop({ required: true })
  pendidikan: string;

  @Prop()
  pekerjaan: string;

  @Prop({ required: true, enum: ['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati'] })
  statusPerkawinan: string;

  @Prop({ required: true, enum: ['Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua', 'Mertua', 'Famili Lain', 'Pembantu', 'Lainnya'] })
  statusHubunganDalamKeluarga: string;

  @Prop()
  namaAyah: string;

  @Prop()
  namaIbu: string;

  @Prop({ required: true })
  alamat: string;

  // Multi-tenant region reference
  @Prop({ type: String, required: false })
  regionId?: string; // Reference to Region (RT level)

  // Legacy fields (for backward compatibility)
  @Prop({ required: true })
  rt: string;

  @Prop({ required: true })
  rw: string;

  @Prop({ required: true })
  desa: string;

  @Prop()
  kecamatan: string;

  @Prop()
  kabupaten: string;

  @Prop()
  provinsi: string;

  @Prop()
  kodePos: string;

  @Prop()
  noTelp: string;

  @Prop()
  email: string;

  // Additional Indonesian-specific fields
  @Prop({ default: 'WNI', enum: ['WNI', 'WNA'] })
  kewarganegaraan: string;

  @Prop({ enum: ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu'] })
  golonganDarah?: string;

  @Prop()
  nomorPaspor?: string;

  @Prop()
  nomorAktaLahir?: string;

  @Prop()
  npwp?: string; // Nomor Pokok Wajib Pajak

  @Prop({ enum: ['Milik Sendiri', 'Kontrak', 'Sewa', 'Bebas Sewa', 'Dinas', 'Lainnya'] })
  statusKepemilikanRumah?: string;

  @Prop()
  fotoUrl?: string; // URL to citizen photo

  // Document scans
  @Prop()
  ktpUrl?: string;

  @Prop()
  kkUrl?: string;

  @Prop()
  aktaLahirUrl?: string;

  @Prop()
  suratNikahUrl?: string;

  @Prop()
  ijazahUrl?: string;

  @Prop()
  bpjsKesehatanUrl?: string;

  @Prop()
  bpjsKetenagakerjaanUrl?: string;

  @Prop()
  vaksinUrl?: string;

  @Prop()
  skckUrl?: string;

  // BPJS Numbers
  @Prop()
  noBpjsKesehatan?: string;

  @Prop()
  noBpjsKetenagakerjaan?: string;

  // Status tracking
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ enum: ['Aktif', 'Pindah', 'Meninggal'] })
  statusKependudukan?: string;

  @Prop()
  tanggalPindah?: Date;

  @Prop()
  tanggalMeninggal?: Date;

  @Prop()
  keterangan: string;

  @Prop({ type: String, required: false })
  userId?: string; // Link ke User._id
}

export const CitizenSchema = SchemaFactory.createForClass(Citizen);

// Create indexes for faster queries (nik already indexed due to unique: true)
CitizenSchema.index({ regionId: 1 }); // Multi-tenant filtering
CitizenSchema.index({ noKk: 1 });
CitizenSchema.index({ namaLengkap: 'text' });
CitizenSchema.index({ rt: 1, rw: 1, desa: 1 }); // Legacy support
CitizenSchema.index({ userId: 1 });
