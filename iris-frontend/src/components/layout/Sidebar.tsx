import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, TicketCheck, RefreshCw, Sparkles,
  UserPlus, Shield, Users, Map, PackagePlus, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
  children?: Omit<NavItem, 'children'>[];
}

const navItems: NavItem[] = [
  { to: '/dashboard',      icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/accounts',       icon: <Building2 size={18} />,       label: 'Accounts' },
  { to: '/tickets',        icon: <TicketCheck size={18} />,      label: 'Tickets' },
  { to: '/renewals',       icon: <RefreshCw size={18} />,        label: 'Renewals' },
  { to: '/releases',       icon: <Sparkles size={18} />,         label: 'Releases' },
  { to: '/prospect',       icon: <UserPlus size={18} />,         label: 'Prospects' },
  { to: '/prism/prioritization', icon: <Zap size={18} />,            label: 'Strategic Analysis' },
];

const adminItems: Omit<NavItem, 'children'>[] = [
  { to: '/admin/users',    icon: <Users size={18} />,      label: 'Users',     adminOnly: true },
  { to: '/admin/zones',    icon: <Map size={18} />,        label: 'Zones',     adminOnly: true },
  { to: '/admin/releases', icon: <PackagePlus size={18} />, label: 'Releases Mgmt', adminOnly: true },
];

function NavItemLink({ to, icon, label, collapsed }: { to: string; icon: React.ReactNode; label: string; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-matrix-lightBlue text-matrix-blue font-semibold'
            : 'text-body hover:bg-matrix-paleBlue hover:text-matrix-navy'
        )
      }
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const { role } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-border z-30 flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('h-14 flex items-center border-b border-border px-4 flex-shrink-0', sidebarCollapsed && 'justify-center')}>
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-matrix-blue rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">IR</span>
            </div>
            <span className="text-xl font-bold text-matrix-navy">IRIS</span>
          </div>
        ) : (
          <div className="w-7 h-7 bg-matrix-blue rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">IR</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavItemLink key={item.to} {...item} collapsed={sidebarCollapsed} />
        ))}

        {role === 'matrix_manager' && (
          <>
            <div className={cn('mx-4 my-2 border-t border-border')} />
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-5 py-1">
                <Shield size={13} className="text-muted" />
                <span className="text-[11px] font-bold text-muted uppercase tracking-wide">Admin</span>
              </div>
            )}
            {adminItems.map((item) => (
              <NavItemLink key={item.to} {...item} collapsed={sidebarCollapsed} />
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'flex items-center gap-2 m-3 px-3 py-2 rounded-lg border border-border text-muted hover:bg-matrix-paleBlue transition-colors text-sm',
          sidebarCollapsed && 'justify-center'
        )}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
      </button>
    </aside>
  );
}
