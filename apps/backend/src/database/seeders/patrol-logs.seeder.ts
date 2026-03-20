import { ScanStatus } from '../../modules/patrol/schemas/patrol-log.schema';

export const seedPatrolLogs = async (
  logModel: any,
  userModel: any,
  schedules: any,
  checkpoints: any,
) => {
  console.log('🌱 Seeding patrol logs...');

  // Get ronda users
  const rondaUsers: any[] = [];
  for (const rw of ['01', '02', '03', '04']) {
    const user = await userModel.findOne({ email: `ronda${rw}@wargahub.id` });
    if (user) rondaUsers.push(user);
  }

  if (rondaUsers.length === 0 || !schedules || !checkpoints) {
    console.log('⚠️  Required data not found, skipping logs seeder');
    return;
  }

  const { completedSchedule, inProgressSchedule } = schedules;

  // Helper to get region scope from schedule
  const getLogScope = (schedule: any) => ({
    desa: schedule?.desa,
    rw: schedule?.rw,
    rt: schedule?.rt,
  });

  // Gather all checkpoint arrays
  const allCheckpointArrays: any[] = [];
  for (const key of Object.keys(checkpoints)) {
    if (Array.isArray(checkpoints[key]) && checkpoints[key].length > 0) {
      allCheckpointArrays.push(...checkpoints[key]);
    }
  }

  if (!completedSchedule || allCheckpointArrays.length === 0) {
    console.log('⚠️  Schedules or checkpoints not found, skipping logs seeder');
    return;
  }

  const logs: any[] = [];

  // Completed schedule logs — scan all its required checkpoints
  const completedCheckpoints = allCheckpointArrays.slice(0, 3);
  completedCheckpoints.forEach((checkpoint: any, index: number) => {
    const baseTime = new Date(completedSchedule.startTime);
    baseTime.setMinutes(baseTime.getMinutes() + index * 30);

    logs.push({
      scheduleId: completedSchedule._id,
      checkpointId: checkpoint._id,
      checkpointName: checkpoint.name,
      checkpointCode: checkpoint.code,
      ...getLogScope(completedSchedule),
      scannedBy: rondaUsers[0]._id,
      scannedByName: rondaUsers[0].name,
      scannedAt: baseTime,
      latitude: checkpoint.latitude + (Math.random() - 0.5) * 0.0001,
      longitude: checkpoint.longitude + (Math.random() - 0.5) * 0.0001,
      gpsAccuracy: Math.floor(Math.random() * 10) + 5,
      distanceFromCheckpoint: Math.floor(Math.random() * 20) + 5,
      status: ScanStatus.VALID,
      validationMessage: 'Scan successful',
      notes: `Checkpoint ${index + 1} berhasil dipindai. Situasi aman.`,
    });
  });

  // In-progress schedule log (first checkpoint scanned)
  if (inProgressSchedule && allCheckpointArrays.length > 0) {
    logs.push({
      scheduleId: inProgressSchedule._id,
      checkpointId: allCheckpointArrays[0]._id,
      checkpointName: allCheckpointArrays[0].name,
      checkpointCode: allCheckpointArrays[0].code,
      ...getLogScope(inProgressSchedule),
      scannedBy: rondaUsers[0]._id,
      scannedByName: rondaUsers[0].name,
      scannedAt: inProgressSchedule.startTime,
      latitude: allCheckpointArrays[0].latitude,
      longitude: allCheckpointArrays[0].longitude,
      gpsAccuracy: 8,
      distanceFromCheckpoint: 12,
      status: ScanStatus.VALID,
      validationMessage: 'Scan successful',
      notes: 'Memulai patroli pagi',
    });
  }

  // Invalid location scan examples
  if (allCheckpointArrays.length > 1) {
    logs.push({
      scheduleId: completedSchedule._id,
      checkpointId: allCheckpointArrays[1]._id,
      checkpointName: allCheckpointArrays[1].name,
      checkpointCode: allCheckpointArrays[1].code,
      ...getLogScope(completedSchedule),
      scannedBy: rondaUsers[0]._id,
      scannedByName: rondaUsers[0].name,
      scannedAt: new Date(completedSchedule.startTime.getTime() + 10 * 60 * 1000),
      latitude: allCheckpointArrays[1].latitude + 0.001,
      longitude: allCheckpointArrays[1].longitude + 0.001,
      gpsAccuracy: 15,
      distanceFromCheckpoint: 156,
      status: ScanStatus.INVALID_LOCATION,
      validationMessage: 'Too far from checkpoint (156m away, max 50m)',
      notes: 'Posisi GPS tidak akurat, scan ulang',
    });
  }

  // Additional valid scans from different ronda users
  if (rondaUsers.length > 1 && allCheckpointArrays.length > 3) {
    for (let i = 1; i < Math.min(rondaUsers.length, 4); i++) {
      const cp = allCheckpointArrays[i + 2];
      if (!cp) continue;
      const scanTime = new Date(completedSchedule.startTime);
      scanTime.setMinutes(scanTime.getMinutes() + (i + 3) * 25);

      logs.push({
        scheduleId: completedSchedule._id,
        checkpointId: cp._id,
        checkpointName: cp.name,
        checkpointCode: cp.code,
        ...getLogScope(completedSchedule),
        scannedBy: rondaUsers[i]._id,
        scannedByName: rondaUsers[i].name,
        scannedAt: scanTime,
        latitude: cp.latitude + (Math.random() - 0.5) * 0.00005,
        longitude: cp.longitude + (Math.random() - 0.5) * 0.00005,
        gpsAccuracy: Math.floor(Math.random() * 8) + 3,
        distanceFromCheckpoint: Math.floor(Math.random() * 15) + 3,
        status: ScanStatus.VALID,
        validationMessage: 'Scan successful',
        notes: `Patroli aman oleh ${rondaUsers[i].name}`,
      });
    }
  }

  // Duplicate scan example
  if (allCheckpointArrays.length > 0) {
    logs.push({
      scheduleId: completedSchedule._id,
      checkpointId: allCheckpointArrays[0]._id,
      checkpointName: allCheckpointArrays[0].name,
      checkpointCode: allCheckpointArrays[0].code,
      ...getLogScope(completedSchedule),
      scannedBy: rondaUsers[0]._id,
      scannedByName: rondaUsers[0].name,
      scannedAt: new Date(completedSchedule.startTime.getTime() + 5 * 60 * 1000),
      latitude: allCheckpointArrays[0].latitude,
      longitude: allCheckpointArrays[0].longitude,
      gpsAccuracy: 6,
      distanceFromCheckpoint: 8,
      status: ScanStatus.DUPLICATE,
      validationMessage: 'Checkpoint already scanned within this schedule',
      notes: 'Scan duplikat, sudah dipindai sebelumnya',
    });
  }

  // Additional patrol logs for other areas
  const additionalLogs: any[] = [];
  for (let i = 4; i < Math.min(allCheckpointArrays.length, 12); i++) {
    const cp = allCheckpointArrays[i];
    const rondaIdx = Math.floor(i / 3) % rondaUsers.length;
    const scanTime = new Date(completedSchedule.startTime);
    scanTime.setMinutes(scanTime.getMinutes() + i * 20);

    additionalLogs.push({
      scheduleId: completedSchedule._id,
      checkpointId: cp._id,
      checkpointName: cp.name,
      checkpointCode: cp.code,
      ...getLogScope(completedSchedule),
      scannedBy: rondaUsers[rondaIdx]._id,
      scannedByName: rondaUsers[rondaIdx].name,
      scannedAt: scanTime,
      latitude: cp.latitude + (Math.random() - 0.5) * 0.0001,
      longitude: cp.longitude + (Math.random() - 0.5) * 0.0001,
      gpsAccuracy: Math.floor(Math.random() * 10) + 4,
      distanceFromCheckpoint: Math.floor(Math.random() * 25) + 3,
      status: ScanStatus.VALID,
      validationMessage: 'Scan successful',
      notes: `Checkpoint area ${cp.name} aman`,
    });
  }
  logs.push(...additionalLogs);

  let created = 0;
  for (const logData of logs) {
    const doc = new logModel(logData);
    await doc.save();
    console.log(`✅ Created log: ${logData.checkpointCode} - ${logData.status}`);
    created++;
  }

  console.log(`✅ Patrol logs seeding completed! (${created} logs)\n`);
};
