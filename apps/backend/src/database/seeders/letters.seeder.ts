import { LetterStatus } from '../../modules/letters/schemas/letter.schema';

export const seedLetters = async (
  letterModel: any,
  templateModel: any,
  userModel: any,
  citizenModel: any,
) => {
  console.log('🌱 Seeding letters...');

  const skdTemplate = await templateModel.findOne({ code: 'SKD' });
  const sktmTemplate = await templateModel.findOne({ code: 'SKTM' });
  const skuTemplate = await templateModel.findOne({ code: 'SKU' });
  const skckTemplate = await templateModel.findOne({ code: 'SKCK' });

  const wargaUser = await userModel.findOne({ email: 'warga@wargahub.id' });
  const rtUser01 = await userModel.findOne({ email: 'ketuart01@wargahub.id' });
  const rtUser02 = await userModel.findOne({ email: 'ketuart02@wargahub.id' });
  const rtUser04 = await userModel.findOne({ email: 'ketuart04@wargahub.id' });
  const rwUser01 = await userModel.findOne({ email: 'ketuarw01@wargahub.id' });
  const rwUser02 = await userModel.findOne({ email: 'ketuarw02@wargahub.id' });
  const desaUser = await userModel.findOne({ email: 'kepaladesa@wargahub.id' });

  // Get several citizens from different RT
  const citizens = await citizenModel.find({ statusKependudukan: 'Aktif' }).limit(15);

  if (!skdTemplate || !wargaUser || !rtUser01 || !desaUser || citizens.length === 0) {
    console.log('⚠️  Required data not found, skipping letters seeder');
    return;
  }

  const getCitizen = (idx: number) => citizens[idx % citizens.length];
  const makeCitizenData = (c: any, keperluan: string) => ({
    nama: c.namaLengkap,
    nik: c.nik,
    tempatLahir: c.tempatLahir,
    tanggalLahir: new Date(c.tanggalLahir).toLocaleDateString('id-ID'),
    jenisKelamin: c.jenisKelamin,
    agama: c.agama,
    pekerjaan: c.pekerjaan,
    alamat: c.alamat,
    keperluan,
  });

  const letters = [
    // 1. PENDING RT
    {
      letterNumber: '001/SKD/RT.01/III/2026',
      templateId: skdTemplate._id, templateName: skdTemplate.name, templateCode: skdTemplate.code,
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(0)._id,
      status: LetterStatus.PENDING_RT,
      data: makeCitizenData(getCitizen(0), 'Pembuatan SIM'),
    },
    // 2. PENDING RW (approved by RT)
    {
      letterNumber: '002/SKD/RT.01/III/2026',
      templateId: skdTemplate._id, templateName: skdTemplate.name, templateCode: skdTemplate.code,
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(1)._id,
      status: LetterStatus.PENDING_RW,
      data: makeCitizenData(getCitizen(1), 'Pendaftaran Kerja'),
      approvedByRT: rtUser01._id, approvedByRTName: rtUser01.name,
      approvedAtRT: new Date('2026-03-14'), rtNotes: 'Data sudah sesuai',
    },
    // 3. PENDING DESA (approved by RT & RW)
    {
      letterNumber: '003/SKD/RT.01/III/2026',
      templateId: skdTemplate._id, templateName: skdTemplate.name, templateCode: skdTemplate.code,
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(2)._id,
      status: LetterStatus.PENDING_DESA,
      data: makeCitizenData(getCitizen(2), 'Pendaftaran Kuliah'),
      approvedByRT: rtUser01._id, approvedByRTName: rtUser01.name,
      approvedAtRT: new Date('2026-03-13'), rtNotes: 'Disetujui',
      approvedByRW: rwUser01._id, approvedByRWName: rwUser01.name,
      approvedAtRW: new Date('2026-03-14'), rwNotes: 'Disetujui',
    },
    // 4. APPROVED (complete)
    {
      letterNumber: '004/SKD/RT.01/III/2026',
      templateId: skdTemplate._id, templateName: skdTemplate.name, templateCode: skdTemplate.code,
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(3)._id,
      status: LetterStatus.APPROVED,
      data: makeCitizenData(getCitizen(3), 'Pembuatan Paspor'),
      approvedByRT: rtUser01._id, approvedByRTName: rtUser01.name,
      approvedAtRT: new Date('2026-03-10'), rtNotes: 'Disetujui',
      approvedByRW: rwUser01._id, approvedByRWName: rwUser01.name,
      approvedAtRW: new Date('2026-03-11'), rwNotes: 'Disetujui',
      approvedByDesa: desaUser._id, approvedByDesaName: desaUser.name,
      approvedAtDesa: new Date('2026-03-12'), desaNotes: 'Disetujui dan ditandatangani',
      pdfUrl: '/uploads/letters/004-SKD-RT.01-III-2026.pdf',
      qrCode: 'data:image/png;base64,placeholder',
      generatedAt: new Date('2026-03-12'),
    },
    // 5. REJECTED
    {
      letterNumber: '005/SKD/RT.01/III/2026',
      templateId: skdTemplate._id, templateName: skdTemplate.name, templateCode: skdTemplate.code,
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(4)._id,
      status: LetterStatus.REJECTED,
      data: makeCitizenData(getCitizen(4), 'Test'),
      rejectedBy: rtUser01._id, rejectedByName: rtUser01.name,
      rejectedAt: new Date('2026-03-13'),
      rejectionReason: 'Data tidak lengkap, harap lengkapi keperluan dengan jelas',
    },
    // 6. SKTM PENDING RT
    {
      letterNumber: '001/SKTM/RT.01/III/2026',
      templateId: sktmTemplate?._id, templateName: sktmTemplate?.name || 'SKTM', templateCode: 'SKTM',
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(5)._id,
      status: LetterStatus.PENDING_RT,
      data: { ...makeCitizenData(getCitizen(5), 'Beasiswa Pendidikan'), namaAnak: 'Ahmad Fauzi', sekolah: 'SD Negeri 1 Sukamaju' },
    },
    // 7. SKU PENDING RW (from RT 02)
    {
      letterNumber: '001/SKU/RT.02/III/2026',
      templateId: skuTemplate?._id, templateName: skuTemplate?.name || 'SKU', templateCode: 'SKU',
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(6)._id,
      status: LetterStatus.PENDING_RW,
      data: { ...makeCitizenData(getCitizen(6), 'Pengajuan KUR Bank'), namaUsaha: 'Toko Kelontong Makmur', jenisUsaha: 'Perdagangan' },
      approvedByRT: rtUser02?._id, approvedByRTName: rtUser02?.name,
      approvedAtRT: new Date('2026-03-12'), rtNotes: 'Usaha sudah terverifikasi',
    },
    // 8. SKCK APPROVED (from RT 04)
    {
      letterNumber: '001/SKCK/RT.04/III/2026',
      templateId: skckTemplate?._id, templateName: skckTemplate?.name || 'SKCK', templateCode: 'SKCK',
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(7)._id,
      status: LetterStatus.APPROVED,
      data: { ...makeCitizenData(getCitizen(7), 'Melamar Pekerjaan') },
      approvedByRT: rtUser04?._id, approvedByRTName: rtUser04?.name,
      approvedAtRT: new Date('2026-03-08'), rtNotes: 'Disetujui',
      approvedByRW: rwUser02?._id, approvedByRWName: rwUser02?.name,
      approvedAtRW: new Date('2026-03-09'), rwNotes: 'Disetujui',
      approvedByDesa: desaUser._id, approvedByDesaName: desaUser.name,
      approvedAtDesa: new Date('2026-03-10'), desaNotes: 'Ditandatangani',
      pdfUrl: '/uploads/letters/001-SKCK-RT.04-III-2026.pdf',
      generatedAt: new Date('2026-03-10'),
    },
    // 9. SKD PENDING RT (from RT 04)
    {
      letterNumber: '001/SKD/RT.04/III/2026',
      templateId: skdTemplate._id, templateName: skdTemplate.name, templateCode: skdTemplate.code,
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(8)._id,
      status: LetterStatus.PENDING_RT,
      data: makeCitizenData(getCitizen(8), 'Pendaftaran Sekolah Anak'),
    },
    // 10. SKTM APPROVED
    {
      letterNumber: '002/SKTM/RT.01/III/2026',
      templateId: sktmTemplate?._id, templateName: sktmTemplate?.name || 'SKTM', templateCode: 'SKTM',
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(9)._id,
      status: LetterStatus.APPROVED,
      data: { ...makeCitizenData(getCitizen(9), 'Bantuan Sosial'), penghasilan: 'Rp 1.500.000/bulan' },
      approvedByRT: rtUser01._id, approvedByRTName: rtUser01.name,
      approvedAtRT: new Date('2026-03-05'), rtNotes: 'Keluarga memang kurang mampu',
      approvedByRW: rwUser01._id, approvedByRWName: rwUser01.name,
      approvedAtRW: new Date('2026-03-06'), rwNotes: 'Disetujui',
      approvedByDesa: desaUser._id, approvedByDesaName: desaUser.name,
      approvedAtDesa: new Date('2026-03-07'), desaNotes: 'Ditandatangani',
      pdfUrl: '/uploads/letters/002-SKTM-RT.01-III-2026.pdf',
      generatedAt: new Date('2026-03-07'),
    },
    // 11. SKD APPROVED RT (awaiting RW)
    {
      letterNumber: '006/SKD/RT.01/III/2026',
      templateId: skdTemplate._id, templateName: skdTemplate.name, templateCode: skdTemplate.code,
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(10)._id,
      status: LetterStatus.PENDING_RW,
      data: makeCitizenData(getCitizen(10), 'Pengurusan BPJS'),
      approvedByRT: rtUser01._id, approvedByRTName: rtUser01.name,
      approvedAtRT: new Date('2026-03-15'), rtNotes: 'Data lengkap',
    },
    // 12. SKD PENDING DESA (from RT 02)
    {
      letterNumber: '002/SKD/RT.02/III/2026',
      templateId: skdTemplate._id, templateName: skdTemplate.name, templateCode: skdTemplate.code,
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(11)._id,
      status: LetterStatus.PENDING_DESA,
      data: makeCitizenData(getCitizen(11), 'Klaim Asuransi'),
      approvedByRT: rtUser02?._id, approvedByRTName: rtUser02?.name,
      approvedAtRT: new Date('2026-03-11'), rtNotes: 'OK',
      approvedByRW: rwUser01._id, approvedByRWName: rwUser01.name,
      approvedAtRW: new Date('2026-03-12'), rwNotes: 'OK',
    },
    // 13. SKU REJECTED
    {
      letterNumber: '002/SKU/RT.01/III/2026',
      templateId: skuTemplate?._id, templateName: skuTemplate?.name || 'SKU', templateCode: 'SKU',
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(12)._id,
      status: LetterStatus.REJECTED,
      data: { ...makeCitizenData(getCitizen(12), 'Izin Usaha'), namaUsaha: 'Warung Makan', jenisUsaha: 'Kuliner' },
      rejectedBy: rtUser01._id, rejectedByName: rtUser01.name,
      rejectedAt: new Date('2026-03-14'),
      rejectionReason: 'Lokasi usaha tidak sesuai dengan alamat KTP',
    },
    // 14. SKTM PENDING RW
    {
      letterNumber: '003/SKTM/RT.01/III/2026',
      templateId: sktmTemplate?._id, templateName: sktmTemplate?.name || 'SKTM', templateCode: 'SKTM',
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(13)._id,
      status: LetterStatus.PENDING_RW,
      data: { ...makeCitizenData(getCitizen(13), 'Keringanan Biaya RS'), diagnosaPenyakit: 'Operasi Katarak' },
      approvedByRT: rtUser01._id, approvedByRTName: rtUser01.name,
      approvedAtRT: new Date('2026-03-15'), rtNotes: 'Disetujui, keluarga memang butuh bantuan',
    },
    // 15. SKCK PENDING RT
    {
      letterNumber: '002/SKCK/RT.01/III/2026',
      templateId: skckTemplate?._id, templateName: skckTemplate?.name || 'SKCK', templateCode: 'SKCK',
      requestedBy: wargaUser._id, requestedByName: wargaUser.name,
      citizenId: getCitizen(14)._id,
      status: LetterStatus.PENDING_RT,
      data: { ...makeCitizenData(getCitizen(14), 'Pendaftaran CPNS') },
    },
  ];

  let created = 0;
  for (const letterData of letters) {
    if (!letterData.templateId) continue;
    const existing = await letterModel.findOne({ letterNumber: letterData.letterNumber });
    if (!existing) {
      const letter = new letterModel(letterData);
      await letter.save();
      console.log(`✅ Created letter: ${letterData.letterNumber} (${letterData.status})`);
      created++;
    } else {
      console.log(`⏭️  Letter already exists: ${letterData.letterNumber}`);
    }
  }

  console.log(`✅ Letters seeding completed! (${created} letters)\n`);
};
