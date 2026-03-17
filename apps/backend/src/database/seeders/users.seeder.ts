import { Role } from '../../common/enums/role.enum';

export const seedUsers = async (userModel: any) => {
  console.log('🌱 Seeding users...');

  const desaName = 'Desa Sukamaju';

  const users = [
    // ==============================
    // Platform Level
    // ==============================
    {
      email: 'superadmin@wargahub.id',
      password: 'Admin123!',
      name: 'Super Administrator',
      role: Role.SUPER_ADMIN,
      phone: '081234567890',
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'admin@wargahub.id',
      password: 'Admin123!',
      name: 'Platform Administrator',
      role: Role.ADMIN_PLATFORM,
      phone: '081234567891',
      isActive: true,
      isEmailVerified: true,
    },

    // ==============================
    // Desa Level
    // ==============================
    {
      email: 'admindesa@wargahub.id',
      password: 'Admin123!',
      name: 'Admin Desa Sukamaju',
      role: Role.ADMIN_DESA,
      phone: '081234567805',
      desa: desaName,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'kepaladesa@wargahub.id',
      password: 'Admin123!',
      name: 'H. Suharto, S.Sos',
      role: Role.KEPALA_DESA,
      phone: '081234567892',
      desa: desaName,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'sekdes@wargahub.id',
      password: 'Admin123!',
      name: 'Ani Widiastuti, S.Pd',
      role: Role.SEKRETARIS_DESA,
      phone: '081234567893',
      desa: desaName,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'kaurkeuangan@wargahub.id',
      password: 'Admin123!',
      name: 'Bambang Suryanto, S.E',
      role: Role.KAUR_KEUANGAN,
      phone: '081234567894',
      desa: desaName,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'kaurumum@wargahub.id',
      password: 'Admin123!',
      name: 'Siti Nurhaliza',
      role: Role.KAUR_UMUM,
      phone: '081234567895',
      desa: desaName,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'kasipemerintahan@wargahub.id',
      password: 'Admin123!',
      name: 'Ahmad Fauzi',
      role: Role.KASI_PEMERINTAHAN,
      phone: '081234567896',
      desa: desaName,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'kasikesejahteraan@wargahub.id',
      password: 'Admin123!',
      name: 'Rina Susanti, A.Md.Kep',
      role: Role.KASI_KESEJAHTERAAN,
      phone: '081234567897',
      desa: desaName,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'kasipelayanan@wargahub.id',
      password: 'Admin123!',
      name: 'Dedi Prasetyo',
      role: Role.KASI_PELAYANAN,
      phone: '081234567898',
      desa: desaName,
      isActive: true,
      isEmailVerified: true,
    },

    // ==============================
    // Ketua RW (4 orang, RW 01-04)
    // ==============================
    ...['01', '02', '03', '04'].map((rw, i) => ({
      email: `ketuarw${rw}@wargahub.id`,
      password: 'Admin123!',
      name: ['Hendra Wijaya', 'Surya Dharma', 'Asep Supriatna', 'Dadang Hermawan'][i],
      role: Role.KETUA_RW,
      phone: `08123456${7810 + i}`,
      desa: desaName,
      rw,
      isActive: true,
      isEmailVerified: true,
    })),

    // ==============================
    // Admin RW (4 orang, RW 01-04)
    // ==============================
    ...['01', '02', '03', '04'].map((rw, i) => ({
      email: `adminrw${rw}@wargahub.id`,
      password: 'Admin123!',
      name: ['Sari Rahayu', 'Neni Sumiati', 'Wulan Dari', 'Tuti Alawiyah'][i],
      role: Role.ADMIN_RW,
      phone: `08123456${7820 + i}`,
      desa: desaName,
      rw,
      isActive: true,
      isEmailVerified: true,
    })),

    // ==============================
    // Ketua RT (12 orang, RT 01-12)
    // ==============================
    ...Array.from({ length: 12 }, (_, i) => {
      const rtNum = String(i + 1).padStart(2, '0');
      const rwNum = String(Math.floor(i / 3) + 1).padStart(2, '0');
      const names = [
        'Joko Susilo', 'Wahyu Pratama', 'Dedi Kurniawan',
        'Ahmad Yani', 'Eko Prasetyo', 'Firman Hidayat',
        'Gilang Ramadhan', 'Hasan Basri', 'Irwan Setiadi',
        'Kurnia Adi', 'Lukman Hakim', 'Mulyadi Santoso',
      ];
      return {
        email: `ketuart${rtNum}@wargahub.id`,
        password: 'Admin123!',
        name: names[i],
        role: Role.KETUA_RT,
        phone: `08123456${7830 + i}`,
        desa: desaName,
        rw: rwNum,
        rt: rtNum,
        isActive: true,
        isEmailVerified: true,
      };
    }),

    // ==============================
    // Admin RT (12 orang, RT 01-12)
    // ==============================
    ...Array.from({ length: 12 }, (_, i) => {
      const rtNum = String(i + 1).padStart(2, '0');
      const rwNum = String(Math.floor(i / 3) + 1).padStart(2, '0');
      const names = [
        'Linda Kartika', 'Mega Puspita', 'Nia Rahmawati',
        'Okta Fitriani', 'Putri Handayani', 'Qory Sandioriva',
        'Ratna Sari', 'Sinta Dewi', 'Tiara Agustina',
        'Ulfa Maharani', 'Vina Garnacho', 'Winda Pramesti',
      ];
      return {
        email: `adminrt${rtNum}@wargahub.id`,
        password: 'Admin123!',
        name: names[i],
        role: Role.ADMIN_RT,
        phone: `08123456${7850 + i}`,
        desa: desaName,
        rw: rwNum,
        rt: rtNum,
        isActive: true,
        isEmailVerified: true,
      };
    }),

    // ==============================
    // Petugas Ronda (4 orang, 1 per RW)
    // ==============================
    ...['01', '02', '03', '04'].map((rw, i) => ({
      email: `ronda${rw}@wargahub.id`,
      password: 'Admin123!',
      name: ['Agus Setiawan', 'Beny Kurniawan', 'Cecep Suhendar', 'Dadan Ramadan'][i],
      role: Role.PETUGAS_RONDA,
      phone: `08123456${7870 + i}`,
      desa: desaName,
      rw,
      isActive: true,
      isEmailVerified: true,
    })),

    // ==============================
    // Warga Sample
    // ==============================
    {
      email: 'warga@wargahub.id',
      password: 'Warga123!',
      name: 'Budi Santoso, S.Pd',
      role: Role.WARGA,
      phone: '081234567804',
      desa: desaName,
      rw: '01',
      rt: '01',
      isActive: true,
      isEmailVerified: true,
    },
  ];

  let created = 0;
  for (const userData of users) {
    const existingUser = await userModel.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new userModel(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.name} (${userData.email})`);
      created++;
    } else {
      console.log(`⏭️  User already exists: ${userData.email}`);
    }
  }

  console.log(`✅ Users seeding completed! (${created} users)\n`);
};
