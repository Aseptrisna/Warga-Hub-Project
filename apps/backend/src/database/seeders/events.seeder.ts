/**
 * Events Seeder
 * Creates sample village events
 */

import { EventCategory, EventStatus } from '../../modules/events/schemas/event.schema';

export const seedEvents = async (eventModel: any, userModel: any) => {
  console.log('🌱 Seeding events...');

  const kepalaDesa = await userModel.findOne({ email: 'kepaladesa@wargahub.id' });
  const kasiKesejahteraan = await userModel.findOne({ email: 'kasikesejahteraan@wargahub.id' });
  const ketuaRW01 = await userModel.findOne({ email: 'ketuarw01@wargahub.id' });

  const now = new Date();
  const pastMonth = new Date(now); pastMonth.setMonth(now.getMonth() - 1);
  const pastWeek = new Date(now); pastWeek.setDate(now.getDate() - 7);
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
  const nextMonth = new Date(now); nextMonth.setMonth(now.getMonth() + 1);
  const twoMonths = new Date(now); twoMonths.setMonth(now.getMonth() + 2);

  const events = [
    {
      namaAcara: 'Kerja Bakti Bulanan',
      deskripsi: 'Kegiatan kerja bakti bulanan membersihkan lingkungan desa, selokan, dan jalan. Diharapkan partisipasi seluruh warga.',
      kategori: EventCategory.KERJA_BAKTI,
      tanggalMulai: new Date(pastMonth.getFullYear(), pastMonth.getMonth(), 15, 7, 0),
      tanggalSelesai: new Date(pastMonth.getFullYear(), pastMonth.getMonth(), 15, 12, 0),
      lokasi: 'Balai Desa Sukamaju',
      penyelenggaraId: kepalaDesa?._id || '',
      penyelenggaraName: kepalaDesa?.name || 'Kepala Desa',
      kapasitas: 200,
      status: EventStatus.COMPLETED,
      desa: 'Desa Sukamaju',
    },
    {
      namaAcara: 'Rapat RW Triwulan',
      deskripsi: 'Rapat koordinasi antar RW membahas program kerja triwulan berikutnya dan evaluasi kegiatan yang sudah berjalan.',
      kategori: EventCategory.RAPAT,
      tanggalMulai: new Date(pastWeek.getFullYear(), pastWeek.getMonth(), pastWeek.getDate(), 19, 0),
      tanggalSelesai: new Date(pastWeek.getFullYear(), pastWeek.getMonth(), pastWeek.getDate(), 21, 0),
      lokasi: 'Aula Balai Desa Sukamaju',
      penyelenggaraId: kepalaDesa?._id || '',
      penyelenggaraName: kepalaDesa?.name || 'Kepala Desa',
      kapasitas: 50,
      status: EventStatus.COMPLETED,
      desa: 'Desa Sukamaju',
    },
    {
      namaAcara: 'Perayaan HUT RI ke-81',
      deskripsi: 'Rangkaian kegiatan perayaan HUT Kemerdekaan RI: upacara bendera, lomba 17-an, pentas seni, dan pesta rakyat.',
      kategori: EventCategory.PERAYAAN,
      tanggalMulai: new Date(now.getFullYear(), 7, 17, 7, 0),
      tanggalSelesai: new Date(now.getFullYear(), 7, 17, 17, 0),
      lokasi: 'Lapangan Desa Sukamaju',
      penyelenggaraId: kepalaDesa?._id || '',
      penyelenggaraName: kepalaDesa?.name || 'Kepala Desa',
      kapasitas: 500,
      status: EventStatus.UPCOMING,
      desa: 'Desa Sukamaju',
    },
    {
      namaAcara: 'Turnamen Badminton Antar RT',
      deskripsi: 'Turnamen bulutangkis antar RT se-Desa Sukamaju. Pendaftaran tim maksimal 3 orang per RT.',
      kategori: EventCategory.OLAHRAGA,
      tanggalMulai: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10, 8, 0),
      tanggalSelesai: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 12, 17, 0),
      lokasi: 'GOR Desa Sukamaju',
      penyelenggaraId: kasiKesejahteraan?._id || '',
      penyelenggaraName: kasiKesejahteraan?.name || 'Kasi Kesejahteraan',
      kapasitas: 100,
      status: EventStatus.UPCOMING,
      desa: 'Desa Sukamaju',
    },
    {
      namaAcara: 'Posyandu Balita',
      deskripsi: 'Kegiatan posyandu rutin bulanan: penimbangan balita, imunisasi, dan penyuluhan gizi untuk ibu dan anak.',
      kategori: EventCategory.SOSIAL,
      tanggalMulai: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0),
      tanggalSelesai: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0),
      lokasi: 'Puskesmas Pembantu Desa Sukamaju',
      penyelenggaraId: kasiKesejahteraan?._id || '',
      penyelenggaraName: kasiKesejahteraan?.name || 'Kasi Kesejahteraan',
      kapasitas: 80,
      status: EventStatus.ONGOING,
      desa: 'Desa Sukamaju',
    },
    {
      namaAcara: 'Pengajian Akbar',
      deskripsi: 'Pengajian akbar dalam rangka memperingati Maulid Nabi Muhammad SAW. Penceramah: Ustadz H. Abdul Somad.',
      kategori: EventCategory.SOSIAL,
      tanggalMulai: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 19, 0),
      tanggalSelesai: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 22, 0),
      lokasi: 'Masjid Al-Ikhlas Desa Sukamaju',
      penyelenggaraId: ketuaRW01?._id || '',
      penyelenggaraName: ketuaRW01?.name || 'Ketua RW 01',
      kapasitas: 300,
      status: EventStatus.UPCOMING,
      desa: 'Desa Sukamaju',
      rw: '01',
    },
    {
      namaAcara: 'Senam Pagi Bersama',
      deskripsi: 'Kegiatan senam pagi rutin setiap hari Minggu untuk menjaga kesehatan dan kebersamaan warga.',
      kategori: EventCategory.OLAHRAGA,
      tanggalMulai: new Date(pastWeek.getFullYear(), pastWeek.getMonth(), pastWeek.getDate() - 1, 6, 0),
      tanggalSelesai: new Date(pastWeek.getFullYear(), pastWeek.getMonth(), pastWeek.getDate() - 1, 8, 0),
      lokasi: 'Lapangan RW 02',
      penyelenggaraId: kasiKesejahteraan?._id || '',
      penyelenggaraName: kasiKesejahteraan?.name || 'Kasi Kesejahteraan',
      kapasitas: 100,
      status: EventStatus.COMPLETED,
      desa: 'Desa Sukamaju',
      rw: '02',
    },
    {
      namaAcara: 'Festival Kuliner Desa',
      deskripsi: 'Festival kuliner tradisional Sunda menampilkan makanan khas daerah. Dibatalkan karena cuaca buruk.',
      kategori: EventCategory.PERAYAAN,
      tanggalMulai: new Date(twoMonths.getFullYear(), twoMonths.getMonth(), 20, 9, 0),
      tanggalSelesai: new Date(twoMonths.getFullYear(), twoMonths.getMonth(), 20, 21, 0),
      lokasi: 'Alun-alun Desa Sukamaju',
      penyelenggaraId: kepalaDesa?._id || '',
      penyelenggaraName: kepalaDesa?.name || 'Kepala Desa',
      kapasitas: 400,
      status: EventStatus.CANCELLED,
      desa: 'Desa Sukamaju',
    },
  ];

  let created = 0;
  for (const data of events) {
    const existing = await eventModel.findOne({ namaAcara: data.namaAcara });
    if (!existing) {
      const doc = new eventModel(data);
      await doc.save();
      console.log(`✅ Created event: ${data.namaAcara} (${data.status})`);
      created++;
    } else {
      console.log(`⏭️  Event already exists: ${data.namaAcara}`);
    }
  }

  console.log(`✅ Events seeding completed! (${created} events)\n`);
};
