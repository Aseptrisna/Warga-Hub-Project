import { PatrolShift, PatrolStatus } from '../../modules/patrol/schemas/patrol-schedule.schema';

export const seedPatrolSchedules = async (
  scheduleModel: any,
  userModel: any,
  regionModel: any,
  checkpoints: any,
) => {
  console.log('🌱 Seeding patrol schedules...');

  // Get ronda users
  const rondaUsers: any[] = [];
  for (const rw of ['01', '02', '03', '04']) {
    const user = await userModel.findOne({ email: `ronda${rw}@wargahub.id` });
    if (user) rondaUsers.push(user);
  }

  // Get some ketua RT
  const ketuaRT01 = await userModel.findOne({ email: 'ketuart01@wargahub.id' });
  const ketuaRT04 = await userModel.findOne({ email: 'ketuart04@wargahub.id' });

  // Get RT regions
  const rt01 = await regionModel.findOne({ name: 'RT 01' });
  const rt04 = await regionModel.findOne({ name: 'RT 04' });
  const rt07 = await regionModel.findOne({ name: 'RT 07' });
  const rt10 = await regionModel.findOne({ name: 'RT 10' });

  if (rondaUsers.length === 0 || !rt01 || !checkpoints) {
    console.log('⚠️  Required data not found, skipping schedules seeder');
    return;
  }

  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

  const getCheckpoints = (rtKey: string) => {
    const cps = checkpoints[rtKey] || [];
    return cps.map((c: any) => c._id);
  };

  const schedules = [
    // Completed patrols
    {
      date: twoDaysAgo,
      shift: PatrolShift.MALAM,
      regionId: rt01._id,
      regionName: 'RT 01',
      assignedOfficers: [rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt01Checkpoints'),
      totalCheckpoints: getCheckpoints('rt01Checkpoints').length || 1,
      completedCheckpoints: getCheckpoints('rt01Checkpoints').length || 1,
      status: PatrolStatus.COMPLETED,
      startTime: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 18, 0),
      endTime: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 22, 30),
      reportSummary: 'Patroli berjalan lancar. Semua checkpoint berhasil dipindai. Situasi aman.',
    },
    {
      date: yesterday,
      shift: PatrolShift.MALAM,
      regionId: rt04?._id || rt01._id,
      regionName: rt04 ? 'RT 04' : 'RT 01',
      assignedOfficers: [rondaUsers[1]?._id || rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[1]?.name || rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt04Checkpoints'),
      totalCheckpoints: getCheckpoints('rt04Checkpoints').length || 1,
      completedCheckpoints: getCheckpoints('rt04Checkpoints').length || 1,
      status: PatrolStatus.COMPLETED,
      startTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 19, 0),
      endTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 0),
      reportSummary: 'Patroli aman. Ditemukan 1 lampu jalan mati di area parkir.',
    },
    {
      date: yesterday,
      shift: PatrolShift.SIANG,
      regionId: rt07?._id || rt01._id,
      regionName: rt07 ? 'RT 07' : 'RT 01',
      assignedOfficers: [rondaUsers[2]?._id || rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[2]?.name || rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt07Checkpoints'),
      totalCheckpoints: getCheckpoints('rt07Checkpoints').length || 1,
      completedCheckpoints: getCheckpoints('rt07Checkpoints').length || 1,
      status: PatrolStatus.COMPLETED,
      startTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 0),
      endTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 12, 0),
      reportSummary: 'Patroli siang berjalan lancar.',
    },
    // In progress
    {
      date: today,
      shift: PatrolShift.SIANG,
      regionId: rt01._id,
      regionName: 'RT 01',
      assignedOfficers: [rondaUsers[0]._id, ketuaRT01?._id].filter(Boolean),
      assignedOfficerNames: [rondaUsers[0].name, ketuaRT01?.name].filter(Boolean),
      requiredCheckpoints: getCheckpoints('rt01Checkpoints'),
      totalCheckpoints: getCheckpoints('rt01Checkpoints').length || 1,
      completedCheckpoints: 1,
      status: PatrolStatus.IN_PROGRESS,
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0),
      notes: 'Patroli siang hari',
    },
    {
      date: today,
      shift: PatrolShift.SIANG,
      regionId: rt10?._id || rt01._id,
      regionName: rt10 ? 'RT 10' : 'RT 01',
      assignedOfficers: [rondaUsers[3]?._id || rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[3]?.name || rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt10Checkpoints'),
      totalCheckpoints: getCheckpoints('rt10Checkpoints').length || 1,
      completedCheckpoints: 0,
      status: PatrolStatus.IN_PROGRESS,
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
      notes: 'Baru dimulai',
    },
    // Scheduled
    {
      date: today,
      shift: PatrolShift.MALAM,
      regionId: rt01._id,
      regionName: 'RT 01',
      assignedOfficers: [rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt01Checkpoints'),
      totalCheckpoints: getCheckpoints('rt01Checkpoints').length || 1,
      completedCheckpoints: 0,
      status: PatrolStatus.SCHEDULED,
      notes: 'Jadwal patroli malam rutin',
    },
    {
      date: today,
      shift: PatrolShift.MALAM,
      regionId: rt04?._id || rt01._id,
      regionName: rt04 ? 'RT 04' : 'RT 01',
      assignedOfficers: [rondaUsers[1]?._id || rondaUsers[0]._id, ketuaRT04?._id].filter(Boolean),
      assignedOfficerNames: [rondaUsers[1]?.name || rondaUsers[0].name, ketuaRT04?.name].filter(Boolean),
      requiredCheckpoints: getCheckpoints('rt04Checkpoints'),
      totalCheckpoints: getCheckpoints('rt04Checkpoints').length || 1,
      completedCheckpoints: 0,
      status: PatrolStatus.SCHEDULED,
      notes: 'Ketua RT ikut patroli',
    },
    {
      date: tomorrow,
      shift: PatrolShift.SIANG,
      regionId: rt01._id,
      regionName: 'RT 01',
      assignedOfficers: [rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt01Checkpoints'),
      totalCheckpoints: getCheckpoints('rt01Checkpoints').length || 1,
      completedCheckpoints: 0,
      status: PatrolStatus.SCHEDULED,
    },
    {
      date: tomorrow,
      shift: PatrolShift.MALAM,
      regionId: rt07?._id || rt01._id,
      regionName: rt07 ? 'RT 07' : 'RT 01',
      assignedOfficers: [rondaUsers[2]?._id || rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[2]?.name || rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt07Checkpoints'),
      totalCheckpoints: getCheckpoints('rt07Checkpoints').length || 1,
      completedCheckpoints: 0,
      status: PatrolStatus.SCHEDULED,
    },
    {
      date: nextWeek,
      shift: PatrolShift.MALAM,
      regionId: rt01._id,
      regionName: 'RT 01',
      assignedOfficers: [rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt01Checkpoints'),
      totalCheckpoints: getCheckpoints('rt01Checkpoints').length || 1,
      completedCheckpoints: 0,
      status: PatrolStatus.SCHEDULED,
      notes: 'Patroli minggu depan',
    },
    {
      date: nextWeek,
      shift: PatrolShift.MALAM,
      regionId: rt10?._id || rt01._id,
      regionName: rt10 ? 'RT 10' : 'RT 01',
      assignedOfficers: [rondaUsers[3]?._id || rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[3]?.name || rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt10Checkpoints'),
      totalCheckpoints: getCheckpoints('rt10Checkpoints').length || 1,
      completedCheckpoints: 0,
      status: PatrolStatus.SCHEDULED,
      notes: 'Patroli minggu depan RW 04',
    },
    // Cancelled
    {
      date: yesterday,
      shift: PatrolShift.SIANG,
      regionId: rt10?._id || rt01._id,
      regionName: rt10 ? 'RT 10' : 'RT 01',
      assignedOfficers: [rondaUsers[3]?._id || rondaUsers[0]._id],
      assignedOfficerNames: [rondaUsers[3]?.name || rondaUsers[0].name],
      requiredCheckpoints: getCheckpoints('rt10Checkpoints'),
      totalCheckpoints: getCheckpoints('rt10Checkpoints').length || 1,
      completedCheckpoints: 0,
      status: PatrolStatus.CANCELLED,
      notes: 'Dibatalkan karena hujan deras',
    },
  ];

  let created = 0;
  for (const scheduleData of schedules) {
    const existing = await scheduleModel.findOne({
      date: scheduleData.date,
      shift: scheduleData.shift,
      regionId: scheduleData.regionId,
    });

    if (!existing) {
      const schedule = new scheduleModel(scheduleData);
      await schedule.save();
      console.log(`✅ Created schedule: ${scheduleData.date.toLocaleDateString()} ${scheduleData.shift} - ${scheduleData.regionName} (${scheduleData.status})`);
      created++;
    } else {
      console.log(`⏭️  Schedule already exists`);
    }
  }

  console.log(`✅ Patrol schedules seeding completed! (${created} schedules)\n`);

  const inProgressSchedule = await scheduleModel.findOne({ status: PatrolStatus.IN_PROGRESS });
  const completedSchedule = await scheduleModel.findOne({ status: PatrolStatus.COMPLETED });
  return { inProgressSchedule, completedSchedule };
};
