/**
 * Shared Role enum for frontend and backend
 */
export enum Role {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN_PLATFORM = 'AdminPlatform',
  ADMIN_DESA = 'AdminDesa',
  KEPALA_DESA = 'KepalaDesa',
  SEKRETARIS_DESA = 'SekretarisDesa',
  KAUR_KEUANGAN = 'KaurKeuangan',
  KAUR_UMUM = 'KaurUmum',
  KASI_PEMERINTAHAN = 'KasiPemerintahan',
  KASI_KESEJAHTERAAN = 'KasiKesejahteraan',
  KASI_PELAYANAN = 'KasiPelayanan',
  KETUA_RW = 'KetuaRW',
  ADMIN_RW = 'AdminRW',
  KETUA_RT = 'KetuaRT',
  ADMIN_RT = 'AdminRT',
  PETUGAS_RONDA = 'PetugasRonda',
  WARGA = 'Warga',
}

export const RoleLabels: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.ADMIN_PLATFORM]: 'Admin Platform',
  [Role.ADMIN_DESA]: 'Admin Desa',
  [Role.KEPALA_DESA]: 'Kepala Desa',
  [Role.SEKRETARIS_DESA]: 'Sekretaris Desa',
  [Role.KAUR_KEUANGAN]: 'Kaur Keuangan',
  [Role.KAUR_UMUM]: 'Kaur Umum',
  [Role.KASI_PEMERINTAHAN]: 'Kasi Pemerintahan',
  [Role.KASI_KESEJAHTERAAN]: 'Kasi Kesejahteraan',
  [Role.KASI_PELAYANAN]: 'Kasi Pelayanan',
  [Role.KETUA_RW]: 'Ketua RW',
  [Role.ADMIN_RW]: 'Admin RW',
  [Role.KETUA_RT]: 'Ketua RT',
  [Role.ADMIN_RT]: 'Admin RT',
  [Role.PETUGAS_RONDA]: 'Petugas Ronda',
  [Role.WARGA]: 'Warga',
};
