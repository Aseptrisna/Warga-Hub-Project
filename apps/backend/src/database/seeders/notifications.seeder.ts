/**
 * Notifications Seeder
 * Creates sample notifications for various users
 */

export const seedNotifications = async (notificationModel: any, userModel: any) => {
  console.log('🌱 Seeding notifications...');

  const superadmin = await userModel.findOne({ email: 'superadmin@wargahub.id' });
  const kepalaDesa = await userModel.findOne({ email: 'kepaladesa@wargahub.id' });
  const ketuaRT01 = await userModel.findOne({ email: 'ketuart01@wargahub.id' });
  const warga = await userModel.findOne({ email: 'warga@wargahub.id' });
  const kaur = await userModel.findOne({ email: 'kaurkeuangan@wargahub.id' });

  const now = new Date();
  const hour = (h: number) => { const d = new Date(now); d.setHours(d.getHours() - h); return d; };
  const day = (d: number) => { const dt = new Date(now); dt.setDate(dt.getDate() - d); return dt; };

  const notifications = [
    // For Warga
    { userId: warga?._id, title: 'Surat Anda Disetujui', message: 'Surat Keterangan Domisili Anda telah disetujui oleh Kepala Desa. Silakan download PDF di halaman surat.', type: 'success', module: 'letters', isRead: false, createdAt: hour(2) },
    { userId: warga?._id, title: 'Iuran Bulan Ini Belum Dibayar', message: 'Iuran Kebersihan bulan Maret 2026 sebesar Rp 25.000 belum dibayar. Silakan lakukan pembayaran.', type: 'warning', module: 'payments', isRead: false, createdAt: day(1) },
    { userId: warga?._id, title: 'Kerja Bakti Minggu Depan', message: 'Pengumuman: Kerja bakti akan dilaksanakan hari Minggu pukul 07.00 di Balai Desa.', type: 'info', module: 'announcements', isRead: true, readAt: day(1), createdAt: day(3) },
    { userId: warga?._id, title: 'Laporan Anda Sedang Diproses', message: 'Laporan "Jalan Berlubang di Gang Mawar" sedang dalam proses penanganan oleh petugas.', type: 'info', module: 'reports', isRead: true, readAt: day(5), createdAt: day(7) },

    // For Ketua RT
    { userId: ketuaRT01?._id, title: 'Pengajuan Surat Baru', message: 'Budi Santoso mengajukan Surat Keterangan Domisili. Mohon segera diverifikasi.', type: 'info', module: 'letters', isRead: false, createdAt: hour(1) },
    { userId: ketuaRT01?._id, title: 'Laporan Warga Baru', message: 'Ada laporan baru: "Jalan Retak di Jl. Dahlia". Mohon ditindaklanjuti.', type: 'warning', module: 'reports', isRead: false, createdAt: hour(4) },
    { userId: ketuaRT01?._id, title: 'Panic Alert - Kecelakaan', message: 'DARURAT: Kecelakaan di Jl. Raya Baleendah. Mohon segera koordinasi bantuan.', type: 'error', module: 'panic', isRead: true, readAt: day(1), createdAt: day(1) },

    // For Kepala Desa
    { userId: kepalaDesa?._id, title: 'Surat Menunggu Persetujuan', message: '3 surat menunggu persetujuan Kepala Desa. Silakan cek halaman surat.', type: 'warning', module: 'letters', isRead: false, createdAt: hour(3) },
    { userId: kepalaDesa?._id, title: 'Rekapitulasi Iuran Bulan Ini', message: 'Tingkat pembayaran iuran bulan ini: 65%. Target: 80%. Mohon ditingkatkan sosialisasi.', type: 'info', module: 'payments', isRead: true, readAt: day(2), createdAt: day(2) },
    { userId: kepalaDesa?._id, title: 'Laporan Bulanan Tersedia', message: 'Laporan statistik bulanan Februari 2026 sudah tersedia. Silakan unduh di dashboard.', type: 'success', module: 'reports', isRead: true, readAt: day(10), createdAt: day(10) },

    // For Kaur Keuangan
    { userId: kaur?._id, title: 'Pembayaran Baru Diterima', message: '5 pembayaran iuran kebersihan baru diterima hari ini. Total: Rp 125.000.', type: 'success', module: 'payments', isRead: false, createdAt: hour(1) },
    { userId: kaur?._id, title: 'Pengajuan Pengeluaran Baru', message: 'Pengajuan pengeluaran untuk perbaikan jalan sebesar Rp 2.500.000 menunggu approval.', type: 'info', module: 'expenses', isRead: false, createdAt: day(1) },

    // For SuperAdmin
    { userId: superadmin?._id, title: 'System Update Available', message: 'WargaHub v2.1.0 tersedia. Fitur baru: Dashboard analytics dan WhatsApp notification.', type: 'info', module: 'system', isRead: false, createdAt: day(1) },
    { userId: superadmin?._id, title: 'Backup Database Berhasil', message: 'Backup database otomatis berhasil dilakukan pada 15 Maret 2026 pukul 02:00 WIB.', type: 'success', module: 'system', isRead: true, readAt: day(2), createdAt: day(2) },
    { userId: superadmin?._id, title: 'Login Gagal Berulang', message: 'Terdeteksi 5 percobaan login gagal dari IP 192.168.1.100 dalam 10 menit terakhir.', type: 'error', module: 'security', isRead: true, readAt: day(3), createdAt: day(3) },
  ];

  let created = 0;
  for (const data of notifications) {
    if (!data.userId) continue;
    const existing = await notificationModel.findOne({ userId: data.userId, title: data.title });
    if (!existing) {
      const doc = new notificationModel(data);
      await doc.save();
      console.log(`✅ Created notification: ${data.title} (${data.type})`);
      created++;
    } else {
      console.log(`⏭️  Notification already exists: ${data.title}`);
    }
  }

  console.log(`✅ Notifications seeding completed! (${created} notifications)\n`);
};
