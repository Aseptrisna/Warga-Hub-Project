/**
 * Guestbook Seeder
 * Creates sample guest visit records
 */

export const seedGuestbook = async (guestbookModel: any) => {
  console.log('🌱 Seeding guestbook entries...');

  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const twoDays = new Date(now); twoDays.setDate(now.getDate() - 2);
  const lastWeek = new Date(now); lastWeek.setDate(now.getDate() - 7);

  const entries = [
    {
      namaTamu: 'Drs. Ahmad Surya',
      nik: '3273019876543210',
      noTelp: '081555666777',
      alamatAsal: 'Kelurahan Pasirjati, Bandung',
      tujuan: 'Mengurus surat keterangan domisili',
      yangDitemui: 'Sekretaris Desa',
      waktuMasuk: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 9, 0),
      waktuKeluar: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 10, 30),
      desa: 'Desa Sukamaju',
      rw: '01',
      rt: '01',
      status: 'Keluar',
    },
    {
      namaTamu: 'Ibu Ratna Dewi',
      noTelp: '085777888999',
      alamatAsal: 'Desa Cibiru, Bandung',
      tujuan: 'Konsultasi program bantuan sosial',
      yangDitemui: 'Kasi Kesejahteraan',
      waktuMasuk: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 13, 0),
      waktuKeluar: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 14, 0),
      desa: 'Desa Sukamaju',
      status: 'Keluar',
    },
    {
      namaTamu: 'Yanti Susanti',
      noTelp: '089666777888',
      alamatAsal: 'Jakarta Selatan',
      tujuan: 'Mengunjungi keluarga',
      yangDitemui: 'Keluarga Budi Santoso',
      waktuMasuk: new Date(twoDays.getFullYear(), twoDays.getMonth(), twoDays.getDate(), 11, 0),
      waktuKeluar: new Date(twoDays.getFullYear(), twoDays.getMonth(), twoDays.getDate(), 16, 0),
      desa: 'Desa Sukamaju',
      rw: '01',
      rt: '01',
      status: 'Keluar',
    },
    {
      namaTamu: 'Pak Dedi Mulyadi',
      nik: '3273011234509876',
      noTelp: '081222333444',
      alamatAsal: 'Desa Ciparay, Bandung',
      tujuan: 'Mengurus izin kegiatan masyarakat',
      yangDitemui: 'Kepala Desa',
      waktuMasuk: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 0),
      waktuKeluar: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 11, 30),
      desa: 'Desa Sukamaju',
      rw: '01',
      status: 'Keluar',
    },
    {
      namaTamu: 'Bapak Suryadi',
      nik: '3273015678901234',
      noTelp: '081333444555',
      alamatAsal: 'Kecamatan Dayeuhkolot',
      tujuan: 'Survey lahan untuk pembangunan mushola',
      yangDitemui: 'Ketua RW 02',
      waktuMasuk: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30),
      desa: 'Desa Sukamaju',
      rw: '02',
      status: 'Masuk',
    },
    {
      namaTamu: 'Ibu Hj. Suminah',
      noTelp: '081444555666',
      alamatAsal: 'Desa Andir, Baleendah',
      tujuan: 'Silaturahmi dengan keluarga di RT 07',
      yangDitemui: 'Keluarga Asep Supriatna',
      waktuMasuk: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
      desa: 'Desa Sukamaju',
      rw: '03',
      rt: '07',
      status: 'Masuk',
    },
    {
      namaTamu: 'Tn. Ridwan Firdaus, S.T.',
      nik: '3201456789012345',
      noTelp: '081666777888',
      alamatAsal: 'Kota Bandung',
      tujuan: 'Koordinasi program CSR perusahaan',
      yangDitemui: 'Kepala Desa',
      waktuMasuk: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      desa: 'Desa Sukamaju',
      status: 'Masuk',
    },
    {
      namaTamu: 'Nn. Fitri Handayani',
      noTelp: '089111222333',
      alamatAsal: 'Universitas Padjadjaran, Jatinangor',
      tujuan: 'Penelitian skripsi tentang desa digital',
      yangDitemui: 'Sekretaris Desa',
      waktuMasuk: new Date(twoDays.getFullYear(), twoDays.getMonth(), twoDays.getDate(), 9, 30),
      waktuKeluar: new Date(twoDays.getFullYear(), twoDays.getMonth(), twoDays.getDate(), 12, 0),
      desa: 'Desa Sukamaju',
      status: 'Keluar',
    },
    {
      namaTamu: 'Bp. Komarudin',
      nik: '3273021234567890',
      noTelp: '081888999000',
      alamatAsal: 'Desa Bojongsoang',
      tujuan: 'Mengambil surat pengantar pindah domisili',
      yangDitemui: 'Kaur Umum',
      waktuMasuk: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 14, 0),
      waktuKeluar: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 14, 30),
      desa: 'Desa Sukamaju',
      status: 'Keluar',
    },
    {
      namaTamu: 'Ibu Dr. Mira Susanti, M.Kes',
      noTelp: '081999000111',
      alamatAsal: 'Puskesmas Baleendah',
      tujuan: 'Supervisi kegiatan Posyandu',
      yangDitemui: 'Kasi Kesejahteraan',
      waktuMasuk: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 45),
      desa: 'Desa Sukamaju',
      status: 'Masuk',
    },
  ];

  let created = 0;
  for (const data of entries) {
    const existing = await guestbookModel.findOne({ namaTamu: data.namaTamu, waktuMasuk: data.waktuMasuk });
    if (!existing) {
      const entry = new guestbookModel(data);
      await entry.save();
      console.log(`✅ Created guestbook: ${data.namaTamu} - ${data.tujuan}`);
      created++;
    } else {
      console.log(`⏭️  Guestbook entry already exists: ${data.namaTamu}`);
    }
  }

  console.log(`✅ Guestbook seeding completed! (${created} entries)\n`);
};
