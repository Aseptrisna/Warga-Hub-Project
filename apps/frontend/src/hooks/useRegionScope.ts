import { useAuthStore } from '../stores/auth.store';

const PLATFORM_ROLES = ['SuperAdmin', 'AdminPlatform'];
const DESA_ROLES = [
  'KepalaDesa', 'SekretarisDesa', 'KaurKeuangan', 'KaurUmum',
  'KasiPemerintahan', 'KasiKesejahteraan', 'KasiPelayanan',
];
const RW_ROLES = ['KetuaRW', 'AdminRW'];

/**
 * Returns region scope params based on current user's role and region assignment.
 * Used to pass as query params to service calls for frontend UX consistency.
 * Note: Backend enforces the real scope - this is for UX improvement only.
 */
export function useRegionScope(): Record<string, string> {
  const user = useAuthStore((s) => s.user);
  if (!user) return {};

  if (PLATFORM_ROLES.includes(user.role)) return {};

  const scope: Record<string, string> = {};
  if (user.desa) scope.desa = user.desa;

  if (DESA_ROLES.includes(user.role)) return scope;

  if (RW_ROLES.includes(user.role)) {
    if (user.rw) scope.rw = user.rw;
    return scope;
  }

  // RT level: KetuaRT, AdminRT, PetugasRonda, Warga
  if (user.rw) scope.rw = user.rw;
  if (user.rt) scope.rt = user.rt;

  return scope;
}
