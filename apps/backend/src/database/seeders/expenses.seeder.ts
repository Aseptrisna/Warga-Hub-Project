/**
 * Expenses Seeder
 * Creates sample expense records with various categories
 */

export const seedExpenses = async (expenseModel: any, userModel: any) => {
  console.log('🌱 Seeding expenses...');

  const kaur = await userModel.findOne({ role: 'KaurKeuangan' });
  const kepalaDesa = await userModel.findOne({ role: 'KepalaDesa' });

  const expenses = [
    // Approved
    {
      keterangan: 'Pembelian ATK kantor desa',
      kategori: 'Operasional',
      jumlah: 350000,
      tanggalPengeluaran: new Date('2026-01-10'),
      penerimaNama: 'Toko Berkah Alat Tulis',
      desa: 'Desa Sukamaju',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-01-11'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Perbaikan jalan gang RT 001',
      kategori: 'Infrastruktur',
      jumlah: 2500000,
      tanggalPengeluaran: new Date('2026-01-15'),
      penerimaNama: 'CV. Jaya Bangunan',
      desa: 'Desa Sukamaju',
      rw: '01', rt: '01',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-01-16'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Kegiatan 17 Agustus - Lomba HUT RI',
      kategori: 'Kegiatan',
      jumlah: 3500000,
      tanggalPengeluaran: new Date('2025-08-10'),
      penerimaNama: 'Panitia HUT RI Desa Sukamaju',
      desa: 'Desa Sukamaju',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2025-08-11'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Bantuan sosial keluarga kurang mampu (5 KK)',
      kategori: 'Sosial',
      jumlah: 2500000,
      tanggalPengeluaran: new Date('2026-02-01'),
      penerimaNama: 'Warga Penerima Bansos',
      desa: 'Desa Sukamaju',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-02-02'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Pengadaan obat-obatan Posyandu',
      kategori: 'Kesehatan',
      jumlah: 800000,
      tanggalPengeluaran: new Date('2026-02-15'),
      penerimaNama: 'Apotek Sehat Mandiri',
      desa: 'Desa Sukamaju',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-02-16'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Biaya cetak formulir dan blanko surat',
      kategori: 'Operasional',
      jumlah: 450000,
      tanggalPengeluaran: new Date('2026-02-20'),
      penerimaNama: 'Percetakan Abadi',
      desa: 'Desa Sukamaju',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-02-21'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Pembelian senter dan rompi ronda',
      kategori: 'Keamanan',
      jumlah: 750000,
      tanggalPengeluaran: new Date('2026-03-01'),
      penerimaNama: 'Toko Elektronik Mandiri',
      desa: 'Desa Sukamaju',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-03-02'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Biaya internet kantor desa (3 bulan)',
      kategori: 'Operasional',
      jumlah: 1500000,
      tanggalPengeluaran: new Date('2026-01-05'),
      penerimaNama: 'PT. Telkom Indonesia',
      desa: 'Desa Sukamaju',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-01-06'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    // Pending
    {
      keterangan: 'Pemasangan lampu penerangan jalan RW 02',
      kategori: 'Infrastruktur',
      jumlah: 3200000,
      tanggalPengeluaran: new Date('2026-03-10'),
      penerimaNama: 'Toko Listrik Jaya',
      desa: 'Desa Sukamaju',
      rw: '02',
      status: 'Pending',
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Pengadaan tong sampah untuk 12 RT',
      kategori: 'Infrastruktur',
      jumlah: 1800000,
      tanggalPengeluaran: new Date('2026-03-12'),
      penerimaNama: 'UD. Plastik Makmur',
      desa: 'Desa Sukamaju',
      status: 'Pending',
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Biaya konsumsi rapat triwulan',
      kategori: 'Kegiatan',
      jumlah: 650000,
      tanggalPengeluaran: new Date('2026-03-15'),
      penerimaNama: 'Warung Sunda Asli',
      desa: 'Desa Sukamaju',
      status: 'Pending',
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    // Rejected
    {
      keterangan: 'Pembelian AC untuk ruang rapat',
      kategori: 'Operasional',
      jumlah: 5000000,
      tanggalPengeluaran: new Date('2026-02-25'),
      penerimaNama: 'Toko Elektronik Jaya',
      desa: 'Desa Sukamaju',
      status: 'Rejected',
      rejectedBy: kepalaDesa?._id, rejectedByName: kepalaDesa?.name || 'Kepala Desa', rejectedAt: new Date('2026-02-26'),
      rejectionReason: 'Anggaran tidak mencukupi untuk periode ini',
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Pengecatan ulang kantor desa',
      kategori: 'Infrastruktur',
      jumlah: 4500000,
      tanggalPengeluaran: new Date('2026-03-05'),
      penerimaNama: 'Toko Cat Warna Indah',
      desa: 'Desa Sukamaju',
      status: 'Pending',
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Bantuan korban banjir RT 10',
      kategori: 'Sosial',
      jumlah: 1500000,
      tanggalPengeluaran: new Date('2026-03-08'),
      penerimaNama: 'Warga RT 10 terdampak',
      desa: 'Desa Sukamaju',
      rw: '04', rt: '10',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-03-08'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
    {
      keterangan: 'Honor petugas kebersihan bulan Maret',
      kategori: 'Operasional',
      jumlah: 2000000,
      tanggalPengeluaran: new Date('2026-03-01'),
      penerimaNama: 'Petugas Kebersihan Desa',
      desa: 'Desa Sukamaju',
      status: 'Approved',
      approvedBy: kepalaDesa?._id, approvedByName: kepalaDesa?.name || 'Kepala Desa', approvedAt: new Date('2026-03-02'),
      createdBy: kaur?._id, createdByName: kaur?.name || 'Kaur Keuangan',
    },
  ];

  let created = 0;
  for (const data of expenses) {
    const existing = await expenseModel.findOne({ keterangan: data.keterangan, tanggalPengeluaran: data.tanggalPengeluaran });
    if (!existing) {
      const expense = new expenseModel(data);
      await expense.save();
      console.log(`✅ Created expense: ${data.keterangan} (Rp ${data.jumlah.toLocaleString('id-ID')})`);
      created++;
    } else {
      console.log(`⏭️  Expense already exists: ${data.keterangan}`);
    }
  }

  console.log(`✅ Expenses seeding completed! (${created} expenses)\n`);
};
