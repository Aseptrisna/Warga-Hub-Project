/**
 * Reports Seeder
 * Creates sample citizen reports/complaints
 */

import { ReportCategory, ReportStatus } from '../../modules/reports/schemas/report.schema';

export const seedReports = async (reportModel: any, userModel: any) => {
  console.log('🌱 Seeding reports...');

  const warga = await userModel.findOne({ email: 'warga@wargahub.id' });
  const ketuaRT01 = await userModel.findOne({ email: 'ketuart01@wargahub.id' });
  const ketuaRT04 = await userModel.findOne({ email: 'ketuart04@wargahub.id' });
  const kepalaDesa = await userModel.findOne({ email: 'kepaladesa@wargahub.id' });

  const now = new Date();
  const lastWeek = new Date(now); lastWeek.setDate(now.getDate() - 7);
  const twoWeeks = new Date(now); twoWeeks.setDate(now.getDate() - 14);
  const lastMonth = new Date(now); lastMonth.setMonth(now.getMonth() - 1);

  const reports = [
    {
      judul: 'Jalan Berlubang di Gang Mawar',
      kategori: ReportCategory.JALAN_RUSAK,
      deskripsi: 'Terdapat lubang besar di Gang Mawar depan rumah No. 7. Berbahaya untuk pengendara motor terutama saat malam hari.',
      lokasi: { alamat: 'Gang Mawar No. 7, RT 01, RW 01', lat: -6.9732, lng: 107.6304 },
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      desa: 'Desa Sukamaju',
      rw: '01',
      rt: '01',
      status: ReportStatus.IN_PROGRESS,
      tanggapan: 'Sudah dilaporkan ke Dinas PU. Perbaikan dijadwalkan minggu depan.',
      respondedBy: ketuaRT01?._id,
      respondedByName: ketuaRT01?.name,
      respondedAt: lastWeek,
      createdAt: twoWeeks,
    },
    {
      judul: 'Lampu Jalan Mati di Jl. Kenanga',
      kategori: ReportCategory.LAMPU_MATI,
      deskripsi: 'Lampu penerangan jalan umum di Jl. Kenanga mati sudah 3 hari. Area menjadi gelap dan rawan keamanan.',
      lokasi: { alamat: 'Jl. Kenanga, RT 04, RW 02', lat: -6.9745, lng: 107.6290 },
      pelaporId: ketuaRT04?._id || '',
      pelaporName: ketuaRT04?.name || 'Ketua RT 04',
      desa: 'Desa Sukamaju',
      rw: '02',
      rt: '04',
      status: ReportStatus.RESOLVED,
      tanggapan: 'Lampu sudah diganti oleh petugas PLN pada tanggal 10 Maret 2026.',
      respondedBy: kepalaDesa?._id,
      respondedByName: kepalaDesa?.name,
      respondedAt: lastWeek,
      createdAt: twoWeeks,
    },
    {
      judul: 'Tumpukan Sampah di Pinggir Sungai',
      kategori: ReportCategory.SAMPAH,
      deskripsi: 'Terdapat tumpukan sampah cukup besar di pinggir sungai dekat jembatan RT 07. Menimbulkan bau tidak sedap.',
      lokasi: { alamat: 'Pinggir Sungai RT 07, RW 03', lat: -6.9760, lng: 107.6320 },
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      desa: 'Desa Sukamaju',
      rw: '03',
      rt: '07',
      status: ReportStatus.PENDING,
      createdAt: lastWeek,
    },
    {
      judul: 'Genangan Air Saat Hujan',
      kategori: ReportCategory.BANJIR,
      deskripsi: 'Setiap hujan deras, area depan RT 10 selalu tergenang air setinggi 20-30 cm. Perlu perbaikan drainase.',
      lokasi: { alamat: 'Jl. Teratai, RT 10, RW 04', lat: -6.9770, lng: 107.6280 },
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      desa: 'Desa Sukamaju',
      rw: '04',
      rt: '10',
      status: ReportStatus.IN_PROGRESS,
      tanggapan: 'Tim desa sedang melakukan survei untuk perbaikan drainase.',
      respondedBy: kepalaDesa?._id,
      respondedByName: kepalaDesa?.name,
      respondedAt: now,
      createdAt: lastMonth,
    },
    {
      judul: 'Motor Hilang di Parkiran Masjid',
      kategori: ReportCategory.KEAMANAN,
      deskripsi: 'Kehilangan motor Honda Beat warna putih di parkiran Masjid Al-Ikhlas saat sholat Jumat. Sudah lapor polisi.',
      lokasi: { alamat: 'Masjid Al-Ikhlas, RT 02, RW 01', lat: -6.9735, lng: 107.6310 },
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      desa: 'Desa Sukamaju',
      rw: '01',
      rt: '02',
      status: ReportStatus.PENDING,
      createdAt: lastWeek,
    },
    {
      judul: 'Pohon Tumbang Menghalangi Jalan',
      kategori: ReportCategory.LAINNYA,
      deskripsi: 'Pohon besar tumbang setelah hujan deras semalam, menghalangi akses jalan utama menuju RT 05.',
      lokasi: { alamat: 'Jl. Flamboyan, RT 05, RW 02', lat: -6.9750, lng: 107.6300 },
      pelaporId: ketuaRT04?._id || '',
      pelaporName: ketuaRT04?.name || 'Ketua RT',
      desa: 'Desa Sukamaju',
      rw: '02',
      rt: '05',
      status: ReportStatus.RESOLVED,
      tanggapan: 'Pohon sudah dipotong dan diangkut oleh tim kerja bakti warga.',
      respondedBy: ketuaRT04?._id,
      respondedByName: ketuaRT04?.name,
      respondedAt: twoWeeks,
      createdAt: twoWeeks,
    },
    {
      judul: 'Saluran Air Tersumbat',
      kategori: ReportCategory.BANJIR,
      deskripsi: 'Saluran air di depan Gang Melati tersumbat sampah, menyebabkan genangan saat hujan.',
      lokasi: { alamat: 'Gang Melati, RT 08, RW 03', lat: -6.9755, lng: 107.6315 },
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      desa: 'Desa Sukamaju',
      rw: '03',
      rt: '08',
      status: ReportStatus.REJECTED,
      tanggapan: 'Lokasi yang dilaporkan bukan wilayah tanggung jawab desa, sudah diarahkan ke DPU Kabupaten.',
      respondedBy: kepalaDesa?._id,
      respondedByName: kepalaDesa?.name,
      respondedAt: lastWeek,
      createdAt: twoWeeks,
    },
    {
      judul: 'Jalan Retak di Jl. Dahlia',
      kategori: ReportCategory.JALAN_RUSAK,
      deskripsi: 'Permukaan jalan retak-retak dan mulai berlubang kecil di beberapa titik. Perlu diperbaiki sebelum makin parah.',
      lokasi: { alamat: 'Jl. Dahlia, RT 07, RW 03', lat: -6.9758, lng: 107.6318 },
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      desa: 'Desa Sukamaju',
      rw: '03',
      rt: '07',
      status: ReportStatus.PENDING,
      createdAt: now,
    },
    {
      judul: 'Lampu Gang Cempaka Mati',
      kategori: ReportCategory.LAMPU_MATI,
      deskripsi: '2 titik lampu penerangan di Gang Cempaka mati. Warga merasa tidak aman saat melewati gang di malam hari.',
      lokasi: { alamat: 'Gang Cempaka, RT 06, RW 02', lat: -6.9748, lng: 107.6295 },
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      desa: 'Desa Sukamaju',
      rw: '02',
      rt: '06',
      status: ReportStatus.PENDING,
      createdAt: now,
    },
    {
      judul: 'Orang Mencurigakan di Malam Hari',
      kategori: ReportCategory.KEAMANAN,
      deskripsi: 'Warga melihat orang mencurigakan berkeliaran di sekitar RT 11 pada dini hari. Mohon patroli ditingkatkan.',
      lokasi: { alamat: 'Jl. Mawar, RT 11, RW 04', lat: -6.9775, lng: 107.6285 },
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      desa: 'Desa Sukamaju',
      rw: '04',
      rt: '11',
      status: ReportStatus.IN_PROGRESS,
      tanggapan: 'Jadwal patroli ronda sudah ditambah intensitasnya di area tersebut.',
      respondedBy: ketuaRT01?._id,
      respondedByName: ketuaRT01?.name,
      respondedAt: now,
      createdAt: lastWeek,
    },
  ];

  let created = 0;
  for (const data of reports) {
    const existing = await reportModel.findOne({ judul: data.judul });
    if (!existing) {
      const doc = new reportModel(data);
      await doc.save();
      console.log(`✅ Created report: ${data.judul} (${data.status})`);
      created++;
    } else {
      console.log(`⏭️  Report already exists: ${data.judul}`);
    }
  }

  console.log(`✅ Reports seeding completed! (${created} reports)\n`);
};
