import { Role } from '../enums/role.enum';

const PLATFORM_ROLES = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];
const DESA_ROLES = [
  Role.ADMIN_DESA,
  Role.KEPALA_DESA,
  Role.SEKRETARIS_DESA,
  Role.KAUR_KEUANGAN,
  Role.KAUR_UMUM,
  Role.KASI_PEMERINTAHAN,
  Role.KASI_KESEJAHTERAAN,
  Role.KASI_PELAYANAN,
];
const RW_ROLES = [Role.KETUA_RW, Role.ADMIN_RW];

/**
 * Get region scope filter based on user role and region assignment.
 * - Platform roles (SuperAdmin, AdminPlatform) → no filter (see all data)
 * - Desa roles → filter by desa only
 * - RW roles → filter by desa + rw
 * - RT roles (KetuaRT, AdminRT, PetugasRonda, Warga) → filter by desa + rw + rt
 */
export function getRegionScope(user: {
  role: string;
  desa?: string;
  rw?: string;
  rt?: string;
}): Record<string, string> {
  if (PLATFORM_ROLES.includes(user.role as Role)) {
    return {};
  }

  const scope: Record<string, string> = {};

  if (user.desa) scope.desa = user.desa;

  if (DESA_ROLES.includes(user.role as Role)) {
    return scope;
  }

  if (RW_ROLES.includes(user.role as Role)) {
    if (user.rw) scope.rw = user.rw;
    return scope;
  }

  // RT level: KetuaRT, AdminRT, PetugasRonda, Warga
  if (user.rw) scope.rw = user.rw;
  if (user.rt) scope.rt = user.rt;

  return scope;
}
