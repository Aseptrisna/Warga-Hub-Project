/**
 * Role-Based Access Control (RBAC) Roles for WargaHub
 *
 * Hierarchy:
 * - Platform Level: SuperAdmin, AdminPlatform
 * - Desa Level: KepalaDesa, SekretarisDesa, Kaur*, Kasi*
 * - RW Level: KetuaRW, AdminRW
 * - RT Level: KetuaRT, AdminRT
 * - Operational: PetugasRonda, Warga
 */

export enum Role {
  // Platform Level (Super Admins)
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN_PLATFORM = 'AdminPlatform',

  // Desa Admin (manages all users & config for their desa)
  ADMIN_DESA = 'AdminDesa',

  // Desa Level (Village Government)
  KEPALA_DESA = 'KepalaDesa',
  SEKRETARIS_DESA = 'SekretarisDesa',
  KAUR_KEUANGAN = 'KaurKeuangan',       // Kepala Urusan Keuangan
  KAUR_UMUM = 'KaurUmum',                 // Kepala Urusan Umum
  KASI_PEMERINTAHAN = 'KasiPemerintahan', // Kepala Seksi Pemerintahan
  KASI_KESEJAHTERAAN = 'KasiKesejahteraan', // Kepala Seksi Kesejahteraan
  KASI_PELAYANAN = 'KasiPelayanan',       // Kepala Seksi Pelayanan

  // RW Level (Rukun Warga)
  KETUA_RW = 'KetuaRW',
  ADMIN_RW = 'AdminRW',

  // RT Level (Rukun Tetangga)
  KETUA_RT = 'KetuaRT',
  ADMIN_RT = 'AdminRT',

  // Operational Roles
  PETUGAS_RONDA = 'PetugasRonda',
  WARGA = 'Warga',                        // Regular citizen
}

/**
 * Role permissions helper
 */
export const RoleHierarchy = {
  [Role.SUPER_ADMIN]: ['*'], // Full access
  [Role.ADMIN_PLATFORM]: ['*'],
  [Role.ADMIN_DESA]: ['desa.*', 'rw.*', 'rt.*', 'warga.*', 'users.desa.*'],
  [Role.KEPALA_DESA]: ['desa.*', 'rw.*', 'rt.*', 'warga.*'],
  [Role.SEKRETARIS_DESA]: ['desa.*', 'rw.*', 'rt.*', 'warga.*'],
  [Role.KAUR_KEUANGAN]: ['payments.*', 'expenses.*', 'reports.financial'],
  [Role.KAUR_UMUM]: ['citizens.*', 'families.*', 'guestbook.*'],
  [Role.KASI_PEMERINTAHAN]: ['letters.*', 'citizens.*', 'families.*'],
  [Role.KASI_KESEJAHTERAAN]: ['events.*', 'reports.*', 'announcements.*'],
  [Role.KASI_PELAYANAN]: ['letters.*', 'guestbook.*', 'announcements.*'],
  [Role.KETUA_RW]: ['rw.*', 'rt.*', 'letters.approve.rw'],
  [Role.ADMIN_RW]: ['rw.*', 'rt.read'],
  [Role.KETUA_RT]: ['rt.*', 'letters.approve.rt', 'payments.rt'],
  [Role.ADMIN_RT]: ['rt.*'],
  [Role.PETUGAS_RONDA]: ['patrol.*', 'panic.respond'],
  [Role.WARGA]: ['letters.request', 'payments.view.own', 'panic.trigger'],
};
