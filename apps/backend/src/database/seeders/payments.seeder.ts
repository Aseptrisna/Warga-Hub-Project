/**
 * Payments Seeder
 * Creates sample payment records for iuran warga
 */

export const seedPayments = async (paymentModel: any, citizenModel: any, userModel: any) => {
  console.log('🌱 Seeding payments...');

  const admin = await userModel.findOne({ email: 'kaurkeuangan@wargahub.id' });
  if (!admin) {
    console.log('⏭️  Skipping payments (admin user not found)');
    return;
  }

  // Get adult citizens (age >= 17)
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 17);
  const adults = await citizenModel.find({
    tanggalLahir: { $lte: cutoffDate },
    statusKependudukan: 'Aktif',
  }).limit(100); // Sample 100 adults

  if (adults.length === 0) {
    console.log('⏭️  Skipping payments (no adult citizens found)');
    return;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const iuranTypes = [
    { jenis: 'Iuran Kebersihan', jumlah: 25000 },
    { jenis: 'Iuran Keamanan', jumlah: 15000 },
  ];

  const statuses = ['Lunas', 'Lunas', 'Lunas', 'Lunas', 'Lunas', 'Lunas', // 60%
    'Belum Bayar', 'Belum Bayar', // 20%
    'Menunggu Verifikasi', // 10%
    'Ditolak', // 10%
  ];

  const methods = ['Tunai', 'Transfer Bank', 'QRIS', 'Tunai', 'Tunai'];

  const payments: any[] = [];
  // Generate 3 months of payments for sampled citizens
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    let month = currentMonth - monthOffset;
    let year = currentYear;
    if (month <= 0) { month += 12; year--; }

    for (const citizen of adults) {
      // Only generate for ~70% of citizens per month to keep count manageable
      if (Math.random() > 0.7) continue;

      const iuran = iuranTypes[Math.floor(Math.random() * iuranTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isLunas = status === 'Lunas';

      payments.push({
        citizenId: citizen._id,
        citizenName: citizen.namaLengkap,
        nik: citizen.nik,
        rt: citizen.rt,
        rw: citizen.rw,
        desa: citizen.desa,
        jenis: iuran.jenis,
        jumlah: iuran.jumlah,
        bulan: month,
        tahun: year,
        status,
        jumlahDibayar: isLunas ? iuran.jumlah : 0,
        tanggalBayar: isLunas ? new Date(year, month - 1, Math.floor(Math.random() * 28) + 1) : undefined,
        metodeBayar: isLunas ? methods[Math.floor(Math.random() * methods.length)] : undefined,
        createdBy: admin._id,
        createdByName: admin.name,
      });

      // Limit to ~250 records
      if (payments.length >= 250) break;
    }
    if (payments.length >= 250) break;
  }

  // Batch insert
  const BATCH_SIZE = 50;
  let created = 0;
  for (let i = 0; i < payments.length; i += BATCH_SIZE) {
    const batch = payments.slice(i, i + BATCH_SIZE);
    const ops = batch.map((p) => ({
      updateOne: {
        filter: { citizenId: p.citizenId, bulan: p.bulan, tahun: p.tahun, jenis: p.jenis },
        update: { $setOnInsert: p },
        upsert: true,
      },
    }));
    const result = await paymentModel.bulkWrite(ops);
    created += result.upsertedCount;
  }

  console.log(`✅ Payments seeding completed! (${created} payment records)\n`);
};
