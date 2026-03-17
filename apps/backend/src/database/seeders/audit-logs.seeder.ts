/**
 * Audit Logs Seeder
 * Creates sample audit trail entries
 */

export const seedAuditLogs = async (auditLogModel: any, userModel: any) => {
  console.log('🌱 Seeding audit logs...');

  const superadmin = await userModel.findOne({ email: 'superadmin@wargahub.id' });
  const kepalaDesa = await userModel.findOne({ email: 'kepaladesa@wargahub.id' });
  const sekdes = await userModel.findOne({ email: 'sekdes@wargahub.id' });
  const ketuaRT01 = await userModel.findOne({ email: 'ketuart01@wargahub.id' });
  const ketuaRW01 = await userModel.findOne({ email: 'ketuarw01@wargahub.id' });
  const kaur = await userModel.findOne({ email: 'kaurkeuangan@wargahub.id' });
  const warga = await userModel.findOne({ email: 'warga@wargahub.id' });
  const adminDesa = await userModel.findOne({ email: 'admindesa@wargahub.id' });

  const day = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; };
  const hour = (h: number) => { const dt = new Date(); dt.setHours(dt.getHours() - h); return dt; };

  const logs = [
    // Login activity
    { userId: superadmin?._id, userName: superadmin?.name, userRole: 'SuperAdmin', action: 'LOGIN', module: 'auth', description: 'Login berhasil dari IP 192.168.1.1', ipAddress: '192.168.1.1', createdAt: hour(1) },
    { userId: kepalaDesa?._id, userName: kepalaDesa?.name, userRole: 'KepalaDesa', action: 'LOGIN', module: 'auth', description: 'Login berhasil dari IP 192.168.1.10', ipAddress: '192.168.1.10', createdAt: hour(2) },
    { userId: warga?._id, userName: warga?.name, userRole: 'Warga', action: 'LOGIN', module: 'auth', description: 'Login berhasil dari IP 192.168.1.50', ipAddress: '192.168.1.50', createdAt: hour(3) },

    // Citizens CRUD
    { userId: sekdes?._id, userName: sekdes?.name, userRole: 'SekretarisDesa', action: 'CREATE', module: 'citizens', entityType: 'Citizen', description: 'Menambahkan data warga baru: Andi Saputra (NIK: 3273010101950001)', createdAt: day(1) },
    { userId: sekdes?._id, userName: sekdes?.name, userRole: 'SekretarisDesa', action: 'UPDATE', module: 'citizens', entityType: 'Citizen', description: 'Mengubah data warga: Budi Santoso - alamat diperbarui', changes: { alamat: { old: 'Jl. Lama No.1', new: 'Jl. Sukamaju No.45' } }, createdAt: day(2) },
    { userId: adminDesa?._id, userName: adminDesa?.name, userRole: 'AdminDesa', action: 'DELETE', module: 'citizens', entityType: 'Citizen', description: 'Menghapus data warga: Data duplikat NIK 3273010101000000', createdAt: day(3) },

    // Letters workflow
    { userId: warga?._id, userName: warga?.name, userRole: 'Warga', action: 'CREATE', module: 'letters', entityType: 'Letter', description: 'Mengajukan Surat Keterangan Domisili untuk keperluan Pembuatan SIM', createdAt: day(1) },
    { userId: ketuaRT01?._id, userName: ketuaRT01?.name, userRole: 'KetuaRT', action: 'APPROVE', module: 'letters', entityType: 'Letter', description: 'Menyetujui surat SKD No. 002/SKD/RT.01/III/2026 di tingkat RT', createdAt: day(1) },
    { userId: ketuaRW01?._id, userName: ketuaRW01?.name, userRole: 'KetuaRW', action: 'APPROVE', module: 'letters', entityType: 'Letter', description: 'Menyetujui surat SKD No. 002/SKD/RT.01/III/2026 di tingkat RW', createdAt: day(1) },
    { userId: kepalaDesa?._id, userName: kepalaDesa?.name, userRole: 'KepalaDesa', action: 'APPROVE', module: 'letters', entityType: 'Letter', description: 'Menyetujui dan menandatangani surat SKD No. 004/SKD/RT.01/III/2026', createdAt: day(2) },
    { userId: ketuaRT01?._id, userName: ketuaRT01?.name, userRole: 'KetuaRT', action: 'REJECT', module: 'letters', entityType: 'Letter', description: 'Menolak surat SKD No. 005/SKD/RT.01/III/2026. Alasan: Data tidak lengkap', createdAt: day(2) },

    // Payments
    { userId: kaur?._id, userName: kaur?.name, userRole: 'KaurKeuangan', action: 'CREATE', module: 'payments', entityType: 'Payment', description: 'Mencatat pembayaran iuran kebersihan: Budi Santoso - Rp 25.000 (Lunas)', createdAt: day(1) },
    { userId: kaur?._id, userName: kaur?.name, userRole: 'KaurKeuangan', action: 'UPDATE', module: 'payments', entityType: 'Payment', description: 'Memverifikasi pembayaran iuran keamanan: Ahmad Fauzi - status diubah ke Lunas', changes: { status: { old: 'Menunggu Verifikasi', new: 'Lunas' } }, createdAt: day(2) },

    // Expenses
    { userId: kaur?._id, userName: kaur?.name, userRole: 'KaurKeuangan', action: 'CREATE', module: 'expenses', entityType: 'Expense', description: 'Mengajukan pengeluaran: Perbaikan jalan gang RT 001 - Rp 2.500.000', createdAt: day(3) },
    { userId: kepalaDesa?._id, userName: kepalaDesa?.name, userRole: 'KepalaDesa', action: 'APPROVE', module: 'expenses', entityType: 'Expense', description: 'Menyetujui pengeluaran: Perbaikan jalan gang RT 001 - Rp 2.500.000', createdAt: day(3) },

    // Export
    { userId: kaur?._id, userName: kaur?.name, userRole: 'KaurKeuangan', action: 'EXPORT', module: 'payments', description: 'Mengexport laporan keuangan bulan Februari 2026 (format: PDF)', createdAt: day(4) },

    // Settings
    { userId: superadmin?._id, userName: superadmin?.name, userRole: 'SuperAdmin', action: 'UPDATE', module: 'settings', entityType: 'Setting', description: 'Mengubah pengaturan: primary_color dari #3B82F6 ke #4F46E5', changes: { primary_color: { old: '#3B82F6', new: '#4F46E5' } }, createdAt: day(5) },

    // User management
    { userId: adminDesa?._id, userName: adminDesa?.name, userRole: 'AdminDesa', action: 'CREATE', module: 'users', entityType: 'User', description: 'Menambahkan user baru: Petugas Ronda RW 03 (ronda03@wargahub.id)', createdAt: day(6) },

    // Logout
    { userId: warga?._id, userName: warga?.name, userRole: 'Warga', action: 'LOGOUT', module: 'auth', description: 'Logout dari sistem', ipAddress: '192.168.1.50', createdAt: hour(4) },
    { userId: kepalaDesa?._id, userName: kepalaDesa?.name, userRole: 'KepalaDesa', action: 'LOGOUT', module: 'auth', description: 'Logout dari sistem', ipAddress: '192.168.1.10', createdAt: hour(5) },
  ];

  let created = 0;
  for (const data of logs) {
    if (!data.userId) continue;
    const doc = new auditLogModel(data);
    await doc.save();
    console.log(`✅ Created audit log: [${data.action}] ${data.module} - ${data.description.substring(0, 50)}...`);
    created++;
  }

  console.log(`✅ Audit logs seeding completed! (${created} logs)\n`);
};
