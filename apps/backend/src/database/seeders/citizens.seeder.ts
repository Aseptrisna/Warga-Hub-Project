import { Role } from '../../common/enums/role.enum';

export const seedCitizens = async (citizenModel: any) => {
  console.log('🌱 Seeding citizens...');

  const citizens = [
    {
      nik: '3201234567890001',
      noKk: '3201234567890123',
      namaLengkap: 'Budi Santoso',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Bandung',
      tanggalLahir: new Date('1990-01-15'),
      agama: 'Islam',
      pendidikan: 'S1',
      pekerjaan: 'Karyawan Swasta',
      statusPerkawinan: 'Kawin',
      statusHubunganDalamKeluarga: 'Kepala Keluarga',
      namaAyah: 'Sutrisno',
      namaIbu: 'Siti Aminah',
      alamat: 'Jl. Merdeka No. 123',
      rt: '02',
      rw: '01',
      desa: 'Desa Sukamaju',
      kecamatan: 'Bandung Utara',
      kabupaten: 'Bandung',
      provinsi: 'Jawa Barat',
      kodePos: '40123',
      noTelp: '081234567890',
      email: 'budi@example.com',
      isActive: true,
    },
    {
      nik: '3201234567890002',
      noKk: '3201234567890123',
      namaLengkap: 'Siti Nurhaliza',
      jenisKelamin: 'Perempuan',
      tempatLahir: 'Bandung',
      tanggalLahir: new Date('1992-05-20'),
      agama: 'Islam',
      pendidikan: 'S1',
      pekerjaan: 'Guru',
      statusPerkawinan: 'Kawin',
      statusHubunganDalamKeluarga: 'Istri',
      namaAyah: 'Ahmad Yani',
      namaIbu: 'Fatimah',
      alamat: 'Jl. Merdeka No. 123',
      rt: '02',
      rw: '01',
      desa: 'Desa Sukamaju',
      kecamatan: 'Bandung Utara',
      kabupaten: 'Bandung',
      provinsi: 'Jawa Barat',
      kodePos: '40123',
      noTelp: '081234567891',
      email: 'siti@example.com',
      isActive: true,
    },
    {
      nik: '3201234567890003',
      noKk: '3201234567890123',
      namaLengkap: 'Ahmad Fauzi',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Bandung',
      tanggalLahir: new Date('2015-08-10'),
      agama: 'Islam',
      pendidikan: 'SD',
      pekerjaan: 'Pelajar',
      statusPerkawinan: 'Belum Kawin',
      statusHubunganDalamKeluarga: 'Anak',
      namaAyah: 'Budi Santoso',
      namaIbu: 'Siti Nurhaliza',
      alamat: 'Jl. Merdeka No. 123',
      rt: '02',
      rw: '01',
      desa: 'Desa Sukamaju',
      kecamatan: 'Bandung Utara',
      kabupaten: 'Bandung',
      provinsi: 'Jawa Barat',
      kodePos: '40123',
      noTelp: '081234567892',
      isActive: true,
    },
  ];

  for (const citizenData of citizens) {
    const existing = await citizenModel.findOne({ nik: citizenData.nik });
    if (!existing) {
      const citizen = new citizenModel(citizenData);
      await citizen.save();
      console.log(`✅ Created citizen: ${citizenData.namaLengkap}`);
    } else {
      console.log(`⏭️  Citizen already exists: ${citizenData.namaLengkap}`);
    }
  }

  console.log('✅ Citizens seeding completed!\n');
};
