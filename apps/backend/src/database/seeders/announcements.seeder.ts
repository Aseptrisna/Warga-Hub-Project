/**
 * Announcements Seeder
 * Creates sample village announcements
 */

export const seedAnnouncements = async (announcementModel: any, userModel: any) => {
  console.log('🌱 Seeding announcements...');

  const kepalaDesa = await userModel.findOne({ email: 'kepaladesa@wargahub.id' });
  const sekdes = await userModel.findOne({ email: 'sekdes@wargahub.id' });
  const kasiKesejahteraan = await userModel.findOne({ email: 'kasikesejahteraan@wargahub.id' });
  const ketuaRW01 = await userModel.findOne({ email: 'ketuarw01@wargahub.id' });

  const now = new Date();
  const lastWeek = new Date(now); lastWeek.setDate(now.getDate() - 7);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);

  const creator = kepalaDesa || { _id: '', name: 'Kepala Desa' };

  const announcements = [
    {
      judul: 'Kerja Bakti Minggu Depan',
      isi: 'Diharapkan kepada seluruh warga untuk mengikuti kegiatan kerja bakti pada hari Minggu pukul 07.00 WIB. Tempat berkumpul di Balai RT masing-masing. Bawa peralatan kebersihan dari rumah.',
      kategori: 'Penting',
      targetDesa: 'Desa Sukamaju',
      isPinned: true,
      createdBy: creator._id,
      createdByName: creator.name,
      isActive: true,
      createdAt: lastWeek,
    },
    {
      judul: 'Pembagian Bantuan Sosial Tahap II',
      isi: 'Pembagian bantuan sosial (bansos) tahap II akan dilaksanakan pada tanggal 25 Maret 2026 di Balai Desa. Warga penerima harap membawa KTP dan KK asli. Distribusi dimulai pukul 08.00 WIB.',
      kategori: 'Umum',
      targetDesa: 'Desa Sukamaju',
      isPinned: false,
      createdBy: (kasiKesejahteraan || creator)._id,
      createdByName: (kasiKesejahteraan || creator).name,
      isActive: true,
      createdAt: yesterday,
    },
    {
      judul: 'Peringatan Waspada Banjir',
      isi: 'Mengingat curah hujan yang tinggi akhir-akhir ini, warga yang tinggal di bantaran sungai harap meningkatkan kewaspadaan. Siapkan tas darurat berisi dokumen penting. Hubungi posko bencana di 0812-3456-7890 jika butuh evakuasi.',
      kategori: 'Mendesak',
      targetDesa: 'Desa Sukamaju',
      targetRW: '04',
      isPinned: true,
      createdBy: creator._id,
      createdByName: creator.name,
      isActive: true,
      createdAt: yesterday,
    },
    {
      judul: 'Jadwal Posyandu Bulan Maret',
      isi: 'Posyandu balita dan lansia bulan Maret 2026:\n- Balita: Setiap Rabu, 08.00-11.00 WIB di Puskesmas Pembantu\n- Lansia: Setiap Jumat, 09.00-11.00 WIB di Balai Desa\nGratis untuk semua warga. Bawa KMS/buku kesehatan.',
      kategori: 'Umum',
      targetDesa: 'Desa Sukamaju',
      isPinned: false,
      createdBy: (kasiKesejahteraan || creator)._id,
      createdByName: (kasiKesejahteraan || creator).name,
      isActive: true,
      createdAt: lastWeek,
    },
    {
      judul: 'Rapat RT Bulanan RW 01',
      isi: 'Rapat bulanan RW 01 akan dilaksanakan Senin, 20 Maret 2026 pukul 19.30 WIB di Pos RW 01. Agenda: evaluasi keamanan, iuran bulanan, dan rencana kerja bakti. Ketua RT wajib hadir.',
      kategori: 'Penting',
      targetDesa: 'Desa Sukamaju',
      targetRW: '01',
      isPinned: false,
      createdBy: (ketuaRW01 || creator)._id,
      createdByName: (ketuaRW01 || creator).name,
      isActive: true,
      createdAt: lastWeek,
    },
    {
      judul: 'Pemadaman Listrik Bergilir',
      isi: 'PLN menginformasikan akan ada pemadaman listrik bergilir pada Sabtu, 22 Maret 2026 pukul 09.00-15.00 WIB untuk perbaikan jaringan. Area terdampak: RW 02 dan RW 03. Harap persiapan menyimpan air dan charge perangkat.',
      kategori: 'Mendesak',
      targetDesa: 'Desa Sukamaju',
      isPinned: true,
      createdBy: (sekdes || creator)._id,
      createdByName: (sekdes || creator).name,
      isActive: true,
      createdAt: now,
    },
    {
      judul: 'Pendaftaran Peserta Turnamen Badminton',
      isi: 'Dibuka pendaftaran peserta Turnamen Badminton Antar RT Desa Sukamaju. Kategori: Tunggal Putra, Ganda Putra, Ganda Campuran. Biaya pendaftaran Rp 50.000/tim. Pendaftaran ditutup 5 April 2026. Hubungi ketua RT masing-masing.',
      kategori: 'Umum',
      targetDesa: 'Desa Sukamaju',
      isPinned: false,
      createdBy: (kasiKesejahteraan || creator)._id,
      createdByName: (kasiKesejahteraan || creator).name,
      isActive: true,
      createdAt: now,
    },
    {
      judul: 'Vaksinasi Gratis untuk Lansia',
      isi: 'Puskesmas Baleendah menyelenggarakan vaksinasi influenza gratis untuk warga lansia (usia 60+) pada Kamis, 27 Maret 2026 pukul 08.00-12.00 di Puskesmas Pembantu Desa Sukamaju. Bawa KTP.',
      kategori: 'Penting',
      targetDesa: 'Desa Sukamaju',
      isPinned: false,
      createdBy: (kasiKesejahteraan || creator)._id,
      createdByName: (kasiKesejahteraan || creator).name,
      isActive: true,
      createdAt: now,
    },
  ];

  let created = 0;
  for (const data of announcements) {
    const existing = await announcementModel.findOne({ judul: data.judul });
    if (!existing) {
      const announcement = new announcementModel(data);
      await announcement.save();
      console.log(`✅ Created announcement: ${data.judul}`);
      created++;
    } else {
      console.log(`⏭️  Announcement already exists: ${data.judul}`);
    }
  }

  console.log(`✅ Announcements seeding completed! (${created} announcements)\n`);
};
