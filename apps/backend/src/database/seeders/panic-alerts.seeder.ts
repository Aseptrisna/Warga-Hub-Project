/**
 * Panic Alerts Seeder
 * Creates sample emergency panic button alerts
 */

import { EmergencyType, PanicStatus } from '../../modules/panic/schemas/panic-alert.schema';

export const seedPanicAlerts = async (panicModel: any, userModel: any) => {
  console.log('🌱 Seeding panic alerts...');

  const warga = await userModel.findOne({ email: 'warga@wargahub.id' });
  const ronda01 = await userModel.findOne({ email: 'ronda01@wargahub.id' });
  const ketuaRT01 = await userModel.findOne({ email: 'ketuart01@wargahub.id' });

  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const lastWeek = new Date(now); lastWeek.setDate(now.getDate() - 7);
  const twoWeeks = new Date(now); twoWeeks.setDate(now.getDate() - 14);
  const lastMonth = new Date(now); lastMonth.setMonth(now.getMonth() - 1);

  const alerts = [
    {
      tipeEmergency: EmergencyType.KEBAKARAN,
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      lokasi: { alamat: 'Jl. Sukamaju No. 45, RT 01, RW 01', lat: -6.9732, lng: 107.6304 },
      deskripsi: 'Kebakaran di dapur rumah akibat korsleting listrik. Api sudah menjalar ke atap.',
      desa: 'Desa Sukamaju',
      rw: '01',
      rt: '01',
      status: PanicStatus.RESOLVED,
      respondedBy: ronda01?._id,
      respondedByName: ronda01?.name,
      respondedAt: new Date(lastMonth.getTime() + 5 * 60000),
      tindakan: 'Petugas ronda dan warga berhasil memadamkan api menggunakan APAR dan air. Damkar tiba 15 menit kemudian. Tidak ada korban jiwa.',
      resolvedAt: new Date(lastMonth.getTime() + 45 * 60000),
      createdAt: lastMonth,
    },
    {
      tipeEmergency: EmergencyType.PENCURIAN,
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      lokasi: { alamat: 'Jl. Melati No. 12, RT 02, RW 01', lat: -6.9752, lng: 107.6293 },
      deskripsi: 'Ada maling masuk rumah saat penghuni tidur. Terdengar suara pecahan kaca jendela.',
      desa: 'Desa Sukamaju',
      rw: '01',
      rt: '02',
      status: PanicStatus.RESPONDED,
      respondedBy: ronda01?._id,
      respondedByName: ronda01?.name,
      respondedAt: new Date(lastWeek.getTime() + 3 * 60000),
      tindakan: 'Petugas ronda langsung mendatangi lokasi. Pelaku berhasil kabur. Laporan polisi sedang diproses.',
      createdAt: lastWeek,
    },
    {
      tipeEmergency: EmergencyType.KESEHATAN,
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      lokasi: { alamat: 'Gang Mawar No. 7, RT 01, RW 01', lat: -6.9738, lng: 107.6308 },
      deskripsi: 'Lansia pingsan di rumah dan tidak sadarkan diri. Butuh bantuan evakuasi ke rumah sakit.',
      desa: 'Desa Sukamaju',
      rw: '01',
      rt: '01',
      status: PanicStatus.RESOLVED,
      respondedBy: ketuaRT01?._id,
      respondedByName: ketuaRT01?.name,
      respondedAt: new Date(twoWeeks.getTime() + 2 * 60000),
      tindakan: 'Warga dan ketua RT membantu evakuasi pasien ke RS Advent Bandung. Kondisi pasien sudah stabil.',
      resolvedAt: new Date(twoWeeks.getTime() + 120 * 60000),
      createdAt: twoWeeks,
    },
    {
      tipeEmergency: EmergencyType.KECELAKAAN,
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      lokasi: { alamat: 'Jl. Raya Baleendah, depan RT 05, RW 02', lat: -6.9742, lng: 107.6314 },
      deskripsi: 'Kecelakaan motor vs motor di perempatan jalan. Ada korban luka dan butuh pertolongan.',
      desa: 'Desa Sukamaju',
      rw: '02',
      rt: '05',
      status: PanicStatus.ACTIVE,
      createdAt: yesterday,
    },
    {
      tipeEmergency: EmergencyType.BENCANA,
      pelaporId: warga?._id || '',
      pelaporName: warga?.name || 'Warga',
      lokasi: { alamat: 'Bantaran Sungai RT 10, RW 04', lat: -6.9770, lng: 107.6280 },
      deskripsi: 'Air sungai meluap setelah hujan deras semalaman. Beberapa rumah di bantaran sungai mulai terendam.',
      desa: 'Desa Sukamaju',
      rw: '04',
      rt: '10',
      status: PanicStatus.RESOLVED,
      respondedBy: ketuaRT01?._id,
      respondedByName: ketuaRT01?.name,
      respondedAt: new Date(twoWeeks.getTime() + 10 * 60000),
      tindakan: 'Evakuasi warga terdampak ke balai desa. Bantuan logistik didistribusikan. BPBD Kabupaten sudah turun.',
      resolvedAt: new Date(twoWeeks.getTime() + 24 * 3600000),
      createdAt: twoWeeks,
    },
  ];

  let created = 0;
  for (const data of alerts) {
    const existing = await panicModel.findOne({ deskripsi: data.deskripsi });
    if (!existing) {
      const doc = new panicModel(data);
      await doc.save();
      console.log(`✅ Created panic alert: ${data.tipeEmergency} (${data.status})`);
      created++;
    } else {
      console.log(`⏭️  Panic alert already exists: ${data.tipeEmergency}`);
    }
  }

  console.log(`✅ Panic alerts seeding completed! (${created} alerts)\n`);
};
