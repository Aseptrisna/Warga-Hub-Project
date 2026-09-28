import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Role, RoleLabels } from '@shared/role.enum';
import {
  LayoutDashboard,
  MapPin,
  Users,
  FileText,
  Wallet,
  Shield,
  Megaphone,
  Flag,
  Calendar,
  AlertCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Receipt,
  BookOpen,
  ClipboardList,
  UserCog,
  User,
  UserCheck,
  Building,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { canAccessPath } from '../../config/permissions';
import { MENU_ITEMS } from '../../config/menu-items';
import { customRolesService } from '../../services/custom-roles.service';
import NotificationBell from '../notifications/NotificationBell';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '/dashboard': LayoutDashboard,
  '/my-profile': User,
  '/regions': MapPin,
  '/citizens': Users,
  '/families': Home,
  '/letters': FileText,
  '/finance': Wallet,
  '/expenses': Receipt,
  '/guestbook': BookOpen,
  '/patrol': Shield,
  '/announcements': Megaphone,
  '/reports': Flag,
  '/events': Calendar,
  '/panic': AlertCircle,
  '/desa/profile': Building,
  '/desa/landing': Globe,
  '/admin/activations': UserCheck,
  '/audit-logs': ClipboardList,
  '/admin/users': UserCog,
  '/admin/roles': ShieldCheck,
  '/settings': Settings,
};

const menuItems = MENU_ITEMS.map((item) => ({ ...item, icon: ICONS[item.path] || Home }));

const BUILT_IN_ROLES = new Set<string>(Object.values(Role));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Non-built-in role codes are custom roles (see modules/custom-roles):
  // their sidebar visibility comes from the role's own menuPaths, not the
  // static config in config/permissions.ts.
  const [customMenu, setCustomMenu] = useState<{ menuPaths: string[]; label: string } | null>(null);

  useEffect(() => {
    if (user?.role && !BUILT_IN_ROLES.has(user.role)) {
      customRolesService
        .getMyMenu()
        .then((res) => setCustomMenu(res))
        .catch(() => setCustomMenu({ menuPaths: [], label: user.role }));
    } else {
      setCustomMenu(null);
    }
  }, [user?.role]);

  const roleLabel = user?.role ? RoleLabels[user.role] || customMenu?.label || user.role : '';

  const visibleMenuItems = menuItems.filter((item) => {
    if (!user?.role) return false;
    if (customMenu) return customMenu.menuPaths.includes(item.path);
    return canAccessPath(user.role, item.path);
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen flex flex-col transition-transform',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'w-64 bg-white border-r border-gray-200',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Home className="w-6 h-6 text-primary-600" />
            <span className="text-base font-semibold text-gray-900">WargaHub</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn('transition-all', sidebarOpen ? 'lg:pl-64' : 'pl-0')}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {user?.desa && (
                <span className="font-medium">
                  {user.desa}
                  {user.rw && ` / RW ${user.rw}`}
                  {user.rt && ` / RT ${user.rt}`}
                </span>
              )}
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
