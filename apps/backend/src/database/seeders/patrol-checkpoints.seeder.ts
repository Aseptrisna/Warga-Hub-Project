import { QrGenerator } from '../../utils/qr-generator';
import { v4 as uuidv4 } from 'uuid';

export const seedPatrolCheckpoints = async (checkpointModel: any, regionModel: any) => {
  console.log('🌱 Seeding patrol checkpoints...');

  // Get all RT regions
  const rtRegions: any[] = [];
  for (let i = 1; i <= 12; i++) {
    const rtName = `RT ${String(i).padStart(2, '0')}`;
    const rt = await regionModel.findOne({ name: rtName });
    if (rt) rtRegions.push(rt);
  }

  if (rtRegions.length === 0) {
    console.log('⚠️  RT regions not found, skipping checkpoints seeder');
    return;
  }

  const allCheckpointData: any[] = [];

  // Base coordinates (Baleendah area)
  const baseLat = -6.9732;
  const baseLng = 107.6303;

  // 1 checkpoint per RT (12 total)
  rtRegions.forEach((rt, idx) => {
    const rtNum = String(idx + 1).padStart(2, '0');
    const rwNum = String(Math.floor(idx / 3) + 1).padStart(2, '0');
    allCheckpointData.push({
      name: `Pos Ronda RT ${rtNum}`,
      code: `CP-RT${rtNum}-001`,
      description: `Pos ronda utama RT ${rtNum}, RW ${rwNum}`,
      regionId: rt._id,
      regionName: `RT ${rtNum}`,
      address: `${rt.address || `RT ${rtNum}, RW ${rwNum}`}`,
      latitude: baseLat + (idx * 0.001),
      longitude: baseLng + (idx * 0.0008),
      validationRadius: 50,
    });
  });

  // 4 extra checkpoints in common areas
  const extras = [
    { name: 'Gerbang Masuk Desa', code: 'CP-DESA-001', description: 'Gerbang utama masuk Desa Sukamaju', regionId: rtRegions[0]._id, regionName: 'Desa Sukamaju', address: 'Jl. Raya Sukamaju Km 0', latitude: baseLat - 0.002, longitude: baseLng - 0.001, validationRadius: 40 },
    { name: 'Lapangan Desa', code: 'CP-DESA-002', description: 'Area lapangan olahraga desa', regionId: rtRegions[3]._id, regionName: 'Desa Sukamaju', address: 'Lapangan Desa Sukamaju', latitude: baseLat + 0.003, longitude: baseLng + 0.002, validationRadius: 60 },
    { name: 'Pasar Desa', code: 'CP-DESA-003', description: 'Area pasar tradisional desa', regionId: rtRegions[6]._id, regionName: 'Desa Sukamaju', address: 'Pasar Desa Sukamaju', latitude: baseLat + 0.005, longitude: baseLng - 0.002, validationRadius: 50 },
    { name: 'Masjid Al-Ikhlas', code: 'CP-DESA-004', description: 'Area parkir Masjid Al-Ikhlas', regionId: rtRegions[1]._id, regionName: 'Desa Sukamaju', address: 'Masjid Al-Ikhlas, RW 01', latitude: baseLat + 0.001, longitude: baseLng + 0.003, validationRadius: 35 },
  ];
  allCheckpointData.push(...extras);

  const checkpoints: any[] = [];
  for (const cpData of allCheckpointData) {
    const checkpointId = uuidv4();
    const securityToken = uuidv4();
    const qrCodeData = JSON.stringify({
      checkpointId,
      code: cpData.code,
      token: securityToken,
      type: 'patrol_checkpoint',
    });

    const qrCode = await QrGenerator.generateQRCode(qrCodeData);

    checkpoints.push({
      _id: checkpointId,
      ...cpData,
      location: {
        type: 'Point',
        coordinates: [cpData.longitude, cpData.latitude],
      },
      qrCode,
      qrCodeData,
      isActive: true,
      totalScans: 0,
    });
  }

  let created = 0;
  for (const checkpoint of checkpoints) {
    const existing = await checkpointModel.findOne({ code: checkpoint.code });
    if (!existing) {
      const doc = new checkpointModel(checkpoint);
      await doc.save();
      console.log(`✅ Created checkpoint: ${checkpoint.name} (${checkpoint.code})`);
      created++;
    } else {
      console.log(`⏭️  Checkpoint already exists: ${checkpoint.name}`);
    }
  }

  console.log(`✅ Patrol checkpoints seeding completed! (${created} checkpoints)\n`);

  const allDocs = await checkpointModel.find({ code: { $in: checkpoints.map(c => c.code) } });
  const result: Record<string, any[]> = {};
  for (let i = 1; i <= 12; i++) {
    const rtKey = `rt${String(i).padStart(2, '0')}Checkpoints`;
    const prefix = `CP-RT${String(i).padStart(2, '0')}`;
    result[rtKey] = allDocs.filter((c: any) => c.code.startsWith(prefix));
  }
  result.desaCheckpoints = allDocs.filter((c: any) => c.code.startsWith('CP-DESA'));
  return result;
};
