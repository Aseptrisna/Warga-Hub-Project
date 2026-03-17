import { RegionType } from '../../modules/regions/schemas/region.schema';

export const seedRegions = async (regionModel: any) => {
  console.log('🌱 Seeding regions...');

  // 1. Provinsi
  const provinsi = new regionModel({
    name: 'Jawa Barat',
    type: RegionType.PROVINSI,
    code: '32',
    parentId: null,
    phone: '(022) 4204871',
    address: 'Jl. Diponegoro No.22, Bandung',
    postalCode: '40115',
    isActive: true,
  });
  await provinsi.save();
  console.log(`✅ Created ${provinsi.type}: ${provinsi.name}`);

  // 2. Kabupaten
  const kabupaten = new regionModel({
    name: 'Bandung',
    type: RegionType.KABUPATEN,
    code: '32.01',
    parentId: provinsi._id,
    provinsi: 'Jawa Barat',
    phone: '(022) 6030770',
    address: 'Jl. Raya Soreang No.1, Soreang',
    postalCode: '40911',
    isActive: true,
  });
  await kabupaten.save();
  console.log(`✅ Created ${kabupaten.type}: ${kabupaten.name}`);

  // 3. Kecamatan
  const kecamatan = new regionModel({
    name: 'Baleendah',
    type: RegionType.KECAMATAN,
    code: '32.01.05',
    parentId: kabupaten._id,
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    phone: '(022) 5940123',
    isActive: true,
  });
  await kecamatan.save();
  console.log(`✅ Created ${kecamatan.type}: ${kecamatan.name}`);

  // 4. Desa
  const desa = new regionModel({
    name: 'Desa Sukamaju',
    type: RegionType.DESA,
    code: '32.01.05.2001',
    parentId: kecamatan._id,
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Baleendah',
    desa: 'Sukamaju',
    phone: '(022) 5940456',
    email: 'desa.sukamaju@bandung.go.id',
    address: 'Jl. Raya Sukamaju No.100',
    postalCode: '40375',
    leaderName: 'H. Suharto, S.Sos',
    leaderPhone: '081234567890',
    subdomain: 'sukamaju',
    description: 'Desa Sukamaju adalah desa yang terletak di Kecamatan Baleendah, Kabupaten Bandung, Jawa Barat. Desa ini memiliki penduduk yang aktif dan ramah.',
    landingConfig: {
      hero: {
        title: 'Selamat Datang di Desa Sukamaju',
        subtitle: 'Desa digital modern yang mengutamakan pelayanan masyarakat',
        backgroundImage: '/images/hero-sukamaju.jpg',
      },
      about: {
        title: 'Tentang Desa Sukamaju',
        description: 'Desa Sukamaju terletak di Kecamatan Baleendah, Kabupaten Bandung. Dengan total 4 RW dan 12 RT, desa ini terus berkembang menuju desa digital yang modern dan transparan.',
        vision: 'Mewujudkan Desa Sukamaju sebagai desa mandiri, modern, dan sejahtera berbasis teknologi digital.',
        mission: ['Meningkatkan pelayanan administrasi melalui digitalisasi', 'Mendorong partisipasi aktif warga dalam pembangunan desa', 'Menciptakan transparansi pengelolaan keuangan desa', 'Membangun infrastruktur digital yang merata'],
      },
      features: ['Layanan Surat Online', 'Pembayaran Iuran Digital', 'Keamanan Lingkungan Terintegrasi', 'Pelaporan Warga Real-time'],
      contact: {
        phone: '(022) 5940456',
        email: 'desa.sukamaju@bandung.go.id',
        address: 'Jl. Raya Sukamaju No.100, Baleendah, Bandung',
      },
      socialMedia: {
        facebook: 'https://facebook.com/desasukamaju',
        instagram: 'https://instagram.com/desasukamaju',
        twitter: 'https://twitter.com/desasukamaju',
      },
    },
    totalCitizens: 0,
    totalFamilies: 0,
    isActive: true,
  });
  await desa.save();
  console.log(`✅ Created ${desa.type}: ${desa.name}`);

  // Helper for common region fields
  const desaBase = {
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Baleendah',
    desa: 'Sukamaju',
    isActive: true,
  };

  // 5-8. Create 4 RW
  const rwData = [
    { name: 'RW 01', rw: '01', leaderName: 'Hendra Wijaya', leaderPhone: '081234567891', phone: '081234567891' },
    { name: 'RW 02', rw: '02', leaderName: 'Surya Dharma', leaderPhone: '081234567901', phone: '081234567901' },
    { name: 'RW 03', rw: '03', leaderName: 'Asep Supriatna', leaderPhone: '081234567911', phone: '081234567911' },
    { name: 'RW 04', rw: '04', leaderName: 'Dadang Hermawan', leaderPhone: '081234567921', phone: '081234567921' },
  ];

  const rwDocs: any[] = [];
  for (const rw of rwData) {
    const doc = new regionModel({
      ...desaBase,
      ...rw,
      type: RegionType.RW,
      parentId: desa._id,
      subdomain: `sukamaju-${rw.rw}`,
    });
    await doc.save();
    rwDocs.push(doc);
    console.log(`✅ Created ${doc.type}: ${doc.name}`);
  }

  // 9-20. Create 12 RT (3 per RW)
  const rtData = [
    // RW 01
    { name: 'RT 01', rt: '01', rw: '01', rwIdx: 0, leaderName: 'Joko Susilo', leaderPhone: '081234567892', address: 'Jl. Merdeka No.123' },
    { name: 'RT 02', rt: '02', rw: '01', rwIdx: 0, leaderName: 'Wahyu Pratama', leaderPhone: '081234567893', address: 'Jl. Raya Baleendah No.200' },
    { name: 'RT 03', rt: '03', rw: '01', rwIdx: 0, leaderName: 'Dedi Kurniawan', leaderPhone: '081234567894', address: 'Jl. Anggrek No.15' },
    // RW 02
    { name: 'RT 04', rt: '04', rw: '02', rwIdx: 1, leaderName: 'Ahmad Yani', leaderPhone: '081234567902', address: 'Jl. Kenanga No.89' },
    { name: 'RT 05', rt: '05', rw: '02', rwIdx: 1, leaderName: 'Eko Prasetyo', leaderPhone: '081234567903', address: 'Jl. Flamboyan No.34' },
    { name: 'RT 06', rt: '06', rw: '02', rwIdx: 1, leaderName: 'Firman Hidayat', leaderPhone: '081234567904', address: 'Jl. Cempaka No.67' },
    // RW 03
    { name: 'RT 07', rt: '07', rw: '03', rwIdx: 2, leaderName: 'Gilang Ramadhan', leaderPhone: '081234567912', address: 'Jl. Dahlia No.56' },
    { name: 'RT 08', rt: '08', rw: '03', rwIdx: 2, leaderName: 'Hasan Basri', leaderPhone: '081234567913', address: 'Jl. Melati No.12' },
    { name: 'RT 09', rt: '09', rw: '03', rwIdx: 2, leaderName: 'Irwan Setiadi', leaderPhone: '081234567914', address: 'Jl. Bougenville No.45' },
    // RW 04
    { name: 'RT 10', rt: '10', rw: '04', rwIdx: 3, leaderName: 'Kurnia Adi', leaderPhone: '081234567922', address: 'Jl. Teratai No.78' },
    { name: 'RT 11', rt: '11', rw: '04', rwIdx: 3, leaderName: 'Lukman Hakim', leaderPhone: '081234567923', address: 'Jl. Mawar No.23' },
    { name: 'RT 12', rt: '12', rw: '04', rwIdx: 3, leaderName: 'Mulyadi Santoso', leaderPhone: '081234567924', address: 'Jl. Sakura No.91' },
  ];

  const rtDocs: any[] = [];
  for (const rt of rtData) {
    const doc = new regionModel({
      ...desaBase,
      name: rt.name,
      type: RegionType.RT,
      parentId: rwDocs[rt.rwIdx]._id,
      rw: rt.rw,
      rt: rt.rt,
      phone: rt.leaderPhone,
      leaderName: rt.leaderName,
      leaderPhone: rt.leaderPhone,
      subdomain: `sukamaju-rt${rt.rt}`,
      address: rt.address,
      totalCitizens: 0,
      totalFamilies: 0,
    });
    await doc.save();
    rtDocs.push(doc);
    console.log(`✅ Created ${doc.type}: ${doc.name}`);
  }

  console.log('✅ Regions seeding completed! (20 regions)\n');

  return {
    provinsi: provinsi._id,
    kabupaten: kabupaten._id,
    kecamatan: kecamatan._id,
    desa: desa._id,
    rw01: rwDocs[0]._id,
    rw02: rwDocs[1]._id,
    rw03: rwDocs[2]._id,
    rw04: rwDocs[3]._id,
    rt01: rtDocs[0]._id,
    rt02: rtDocs[1]._id,
    rt03: rtDocs[2]._id,
    rt04: rtDocs[3]._id,
    rt05: rtDocs[4]._id,
    rt06: rtDocs[5]._id,
    rt07: rtDocs[6]._id,
    rt08: rtDocs[7]._id,
    rt09: rtDocs[8]._id,
    rt10: rtDocs[9]._id,
    rt11: rtDocs[10]._id,
    rt12: rtDocs[11]._id,
  };
};
