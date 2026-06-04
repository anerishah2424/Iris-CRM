import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useZones } from '@/hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { NotificationDropdown } from './NotificationDropdown';

export function TopBar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, role, zoneName, selectedZoneId, setSelectedZone, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { data: zones } = useZones();

  const [searchVal, setSearchVal] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Global `/` shortcut → focus search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('topbar-search')?.focus();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/accounts?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const handleZoneChange = (zoneId: string) => {
    const id = zoneId === 'all' ? null : Number(zoneId);
    setSelectedZone(id);
    qc.invalidateQueries();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 sticky top-0 bg-white border-b border-border z-40 flex items-center px-4 gap-3 flex-shrink-0">
      {/* Mobile hamburger */}
      <button onClick={toggleSidebar} className="lg:hidden p-1.5 rounded-lg hover:bg-matrix-paleBlue">
        <Menu size={20} className="text-body" />
      </button>

      {/* Logo (mobile) */}
      <span className="lg:hidden text-xl font-bold text-matrix-navy">IRIS</span>

      {/* Zone selector — matrix_manager only */}
      {role === 'matrix_manager' && zones && (
        <select
          value={selectedZoneId ?? 'all'}
          onChange={(e) => handleZoneChange(e.target.value)}
          className="hidden md:block text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-body focus:outline-none focus:ring-2 focus:ring-matrix-blue"
        >
          <option value="all">All Zones</option>
          {(zones as { zone_id: number; zone_name: string }[]).map((z) => (
            <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
          ))}
        </select>
      )}
      {role === 'Sales_manager' && zoneName && (
        <span className="hidden md:flex items-center gap-1.5 text-sm bg-matrix-paleBlue text-matrix-blue px-3 py-1.5 rounded-lg font-medium">
          <span className="w-2 h-2 bg-matrix-blue rounded-full" />
          {zoneName}
        </span>
      )}

      {/* Search */}
      <div className="flex-1 max-w-sm relative ml-2">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          id="topbar-search"
          type="text"
          placeholder="Search accounts… (/)"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-matrix-blue transition-colors"
        />
      </div>

      <div className="flex-1" />

      {/* Notifications */}
      <NotificationDropdown />

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen((o) => !o)}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-matrix-paleBlue transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-matrix-blue flex items-center justify-center text-white text-sm font-bold">
            {user?.full_name?.charAt(0) ?? 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-[13px] font-semibold text-matrix-navy leading-tight">{user?.full_name}</div>
            <div className="text-[11px] text-muted leading-tight capitalize">{role?.replace('_', ' ')}</div>
          </div>
          <ChevronDown size={14} className={cn('text-muted transition-transform', userMenuOpen && 'rotate-180')} />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-border shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b border-border">
              <div className="text-[13px] font-semibold text-matrix-navy">{user?.full_name}</div>
              <div className="text-[11px] text-muted">{user?.email}</div>
            </div>
            <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-body hover:bg-matrix-paleBlue transition-colors">
              <User size={14} /> Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-health-red hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
