/**
 * Iuran Types Seeder
 * Creates iuran/fee types for the village
 */

export const seedIuranTypes = async (iuranTypeModel: any, userModel: any) => {
  console.log('🌱 Seeding iuran types...');

  const admin = await userModel.findOne({ email: 'kaurkeuangan@wargahub.id' });

  const types = [
    {
      nama: 'Iuran Kebersihan',
      jumlah: 25000,
      periode: 'Bulanan',
      keterangan: 'Iuran kebersihan lingkungan untuk biaya petugas kebersihan dan peralatan',
      desa: 'Desa Sukamaju',
      scopeLevel: 'desa',
      isActive: true,
      createdBy: admin?._id,
      createdByName: admin?.name || 'Kaur Keuangan',
    },
    {
      nama: 'Iuran Keamanan',
      jumlah: 15000,
      periode: 'Bulanan',
      keterangan: 'Iuran keamanan lingkungan untuk biaya ronda malam dan peralatan keamanan',
      desa: 'Desa Sukamaju',
      scopeLevel: 'desa',
      isActive: true,
      createdBy: admin?._id,
      createdByName: admin?.name || 'Kaur Keuangan',
    },
    {
      nama: 'Iuran RT',
      jumlah: 10000,
      periode: 'Bulanan',
      keterangan: 'Iuran operasional RT untuk kegiatan dan keperluan warga setempat',
      desa: 'Desa Sukamaju',
      scopeLevel: 'rt',
      isActive: true,
      createdBy: admin?._id,
      createdByName: admin?.name || 'Kaur Keuangan',
    },
    {
      nama: 'Iuran Sosial',
      jumlah: 50000,
      periode: 'Tahunan',
      keterangan: 'Dana sosial tahunan untuk bantuan warga kurang mampu dan kegiatan sosial',
      desa: 'Desa Sukamaju',
      scopeLevel: 'desa',
      isActive: true,
      createdBy: admin?._id,
      createdByName: admin?.name || 'Kaur Keuangan',
    },
  ];

  let created = 0;
  for (const data of types) {
    const existing = await iuranTypeModel.findOne({ nama: data.nama, desa: data.desa });
    if (!existing) {
      const doc = new iuranTypeModel(data);
      await doc.save();
      console.log(`✅ Created iuran type: ${data.nama} (Rp ${data.jumlah.toLocaleString('id-ID')}/${data.periode})`);
      created++;
    } else {
      console.log(`⏭️  Iuran type already exists: ${data.nama}`);
    }
  }

  console.log(`✅ Iuran types seeding completed! (${created} types)\n`);
};
