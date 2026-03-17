import { Role } from '@shared/role.enum';

export interface MenuPermission {
  path: string;
  allowedRoles: Role[];
}

// Which roles can see which menu items in the sidebar
// Berdasarkan tupoksi tata kelola desa Indonesia (UU 6/2014, PP 43/2014)
export const menuPermissions: MenuPermission[] = [
  {
    path: '/dashboard',
    allowedRoles: Object.values(Role) as Role[],
  },
  {
    // Profil Saya: semua user bisa akses profil sendiri
    path: '/my-profile',
    allowedRoles: Object.values(Role) as Role[],
  },
  {
    // Wilayah: KasiPemerintahan = urusan kependudukan & wilayah
    path: '/regions',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_PEMERINTAHAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
    ],
  },
  {
    // Data Warga: Kasi view utk referensi pelayanan/kesejahteraan (Warga akses profil via /my-profile)
    path: '/citizens',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM,
      Role.KASI_PEMERINTAHAN, Role.KASI_KESEJAHTERAAN, Role.KASI_PELAYANAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
    ],
  },
  {
    // Kartu Keluarga: Warga akses data keluarga via /my-profile
    path: '/families',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PEMERINTAHAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
    ],
  },
  {
    // Surat: KaurUmum arsip surat masuk/keluar
    path: '/letters',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM,
      Role.KASI_PEMERINTAHAN, Role.KASI_PELAYANAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
      Role.WARGA,
    ],
  },
  {
    // Keuangan/Iuran: SekretarisDesa oversight, KaurKeuangan utama
    path: '/finance',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
      Role.WARGA,
    ],
  },
  {
    // Pengeluaran: KaurKeuangan utama
    path: '/expenses',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
    ],
  },
  {
    // Buku Tamu: KaurUmum + KasiPelayanan utama
    path: '/guestbook',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PELAYANAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
    ],
  },
  {
    // Ronda: KetuaRT utama, PetugasRonda scan
    path: '/patrol',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
      Role.PETUGAS_RONDA,
    ],
  },
  {
    path: '/announcements',
    allowedRoles: Object.values(Role) as Role[],
  },
  {
    // Laporan: KasiKesejahteraan + KasiPemerintahan tanggapi
    path: '/reports',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
      Role.KASI_KESEJAHTERAAN, Role.KASI_PEMERINTAHAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
      Role.WARGA,
    ],
  },
  {
    // Event: KasiKesejahteraan utama
    path: '/events',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_KESEJAHTERAAN,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
      Role.WARGA,
    ],
  },
  {
    path: '/panic',
    allowedRoles: Object.values(Role) as Role[],
  },
  {
    path: '/audit-logs',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
    ],
  },
  {
    // Aktivasi Warga: admin RT/RW/Desa approve pendaftaran
    path: '/admin/activations',
    allowedRoles: [
      Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
      Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
      Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
    ],
  },
  {
    path: '/admin/users',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA],
  },
  {
    // Profil Desa: AdminDesa only
    path: '/desa/profile',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA],
  },
  {
    // Landing Page Manager: AdminDesa only
    path: '/desa/landing',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA],
  },
  {
    path: '/settings',
    allowedRoles: Object.values(Role) as Role[],
  },
];

// Helper: check if a role can access a path
export function canAccessPath(role: Role, path: string): boolean {
  const perm = menuPermissions.find((p) => p.path === path);
  if (!perm) return true;
  return perm.allowedRoles.includes(role);
}

// Action permissions per module
// Berdasarkan tupoksi perangkat desa Indonesia
export const actionPermissions = {
  // ═══════════════════════════════════════════
  // WILAYAH - KasiPemerintahan: urusan wilayah & kependudukan
  // ═══════════════════════════════════════════
  regions: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_PEMERINTAHAN, Role.KETUA_RW, Role.ADMIN_RW],
    edit: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_PEMERINTAHAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.ADMIN_RW],
  },

  // ═══════════════════════════════════════════
  // DATA WARGA - KasiPemerintahan utama (data kependudukan)
  // ═══════════════════════════════════════════
  citizens: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PEMERINTAHAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    edit: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PEMERINTAHAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA],
  },

  // ═══════════════════════════════════════════
  // KARTU KELUARGA - KasiPemerintahan utama
  // ═══════════════════════════════════════════
  families: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PEMERINTAHAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    edit: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PEMERINTAHAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA],
  },

  // ═══════════════════════════════════════════
  // PENGELUARAN - KaurKeuangan utama, KepalaDesa approve akhir
  // ═══════════════════════════════════════════
  expenses: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    approve: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.KAUR_KEUANGAN],
  },

  // ═══════════════════════════════════════════
  // BUKU TAMU - KaurUmum + KasiPelayanan utama
  // ═══════════════════════════════════════════
  guestbook: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PELAYANAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    checkout: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PELAYANAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.KETUA_RT, Role.ADMIN_RT],
  },

  // ═══════════════════════════════════════════
  // AUDIT LOG - hanya pimpinan desa
  // ═══════════════════════════════════════════
  audit: {
    view: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA],
  },

  // ═══════════════════════════════════════════
  // IURAN/PEMBAYARAN - KaurKeuangan utama
  // ═══════════════════════════════════════════
  payments: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.KAUR_KEUANGAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    edit: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KAUR_KEUANGAN, Role.KETUA_RT, Role.ADMIN_RT],
    delete: [Role.SUPER_ADMIN, Role.KAUR_KEUANGAN],
    verify: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    uploadBukti: Object.values(Role) as Role[],
    viewMatrix: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
  },

  // ═══════════════════════════════════════════
  // TIPE IURAN - KaurKeuangan utama
  // ═══════════════════════════════════════════
  iuranTypes: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    edit: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_KEUANGAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
  },

  // ═══════════════════════════════════════════
  // PENGUMUMAN - SekretarisDesa + KasiPelayanan, Ketua RW/RT bisa pin
  // ═══════════════════════════════════════════
  announcements: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_PELAYANAN, Role.KASI_KESEJAHTERAAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    edit: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA],
    pin: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.KETUA_RT],
  },

  // ═══════════════════════════════════════════
  // SURAT MENYURAT - KasiPelayanan utama, approval chain RT→RW→Desa
  // ═══════════════════════════════════════════
  letters: {
    create: Object.values(Role) as Role[],
    approve: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_PELAYANAN, Role.KETUA_RW, Role.KETUA_RT],
    template: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_PELAYANAN],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA],
  },

  // ═══════════════════════════════════════════
  // LAPORAN WARGA - KasiKesejahteraan + KasiPemerintahan tanggapi
  // ═══════════════════════════════════════════
  reports: {
    create: Object.values(Role) as Role[],
    respond: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_KESEJAHTERAAN, Role.KASI_PEMERINTAHAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA],
  },

  // ═══════════════════════════════════════════
  // EVENT - KasiKesejahteraan utama (kegiatan sosial)
  // ═══════════════════════════════════════════
  events: {
    create: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_KESEJAHTERAAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    delete: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA],
  },

  // ═══════════════════════════════════════════
  // RONDA/PATROL - KetuaRT kelola, PetugasRonda scan
  // ═══════════════════════════════════════════
  patrol: {
    manage: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT],
    scan: [Role.PETUGAS_RONDA, Role.KETUA_RT, Role.ADMIN_RT],
  },

  // ═══════════════════════════════════════════
  // PANIC BUTTON - semua bisa trigger, responder = pimpinan + ronda
  // ═══════════════════════════════════════════
  panic: {
    trigger: Object.values(Role) as Role[],
    respond: [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.KETUA_RW, Role.KETUA_RT, Role.ADMIN_RT, Role.PETUGAS_RONDA],
  },
};

// Helper: check if user can perform action
export function canPerformAction(role: Role, module: string, action: string): boolean {
  const mod = (actionPermissions as any)[module];
  if (!mod) return true;
  const roles = mod[action];
  if (!roles) return true;
  return roles.includes(role);
}
