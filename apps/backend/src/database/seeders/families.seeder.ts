/**
 * Families (Kartu Keluarga) Seeder
 * Creates family records based on existing citizen data
 */

export const seedFamilies = async (familyModel: any, citizenModel: any) => {
  console.log('🌱 Seeding families...');

  // Get unique KK numbers from citizens
  const kkGroups = await citizenModel.aggregate([
    {
      $group: {
        _id: '$noKk',
        kepala: {
          $first: {
            $cond: [
              { $eq: ['$statusHubunganDalamKeluarga', 'Kepala Keluarga'] },
              '$namaLengkap',
              null,
            ],
          },
        },
        firstMember: { $first: '$namaLengkap' },
        alamat: { $first: '$alamat' },
        rt: { $first: '$rt' },
        rw: { $first: '$rw' },
        desa: { $first: '$desa' },
        kecamatan: { $first: '$kecamatan' },
        kabupaten: { $first: '$kabupaten' },
        provinsi: { $first: '$provinsi' },
        count: { $sum: 1 },
      },
    },
  ]);

  for (const group of kkGroups) {
    const existing = await familyModel.findOne({ noKk: group._id });
    if (!existing) {
      // Find the actual kepala keluarga
      const kepala = await citizenModel.findOne({
        noKk: group._id,
        statusHubunganDalamKeluarga: 'Kepala Keluarga',
      });

      const family = new familyModel({
        noKk: group._id,
        kepalaKeluargaId: kepala?._id || undefined,
        kepalaKeluargaNama: kepala?.namaLengkap || group.firstMember,
        alamat: group.alamat,
        rt: group.rt,
        rw: group.rw,
        desa: group.desa,
        kecamatan: group.kecamatan || '',
        kabupaten: group.kabupaten || '',
        provinsi: group.provinsi || '',
        jumlahAnggota: group.count,
        isActive: true,
      });
      await family.save();
      console.log(`✅ Created family: ${kepala?.namaLengkap || group.firstMember} (${group._id}) - ${group.count} anggota`);
    } else {
      console.log(`⏭️  Family already exists: ${group._id}`);
    }
  }

  console.log(`✅ Families seeding completed! (${kkGroups.length} keluarga)\n`);
};
