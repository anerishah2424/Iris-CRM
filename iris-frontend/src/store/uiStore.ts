import { create } from 'zustand';
import type { AccountFilters } from '@/types/account';

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (val: boolean) => void;
  accountFilters: AccountFilters;
  setAccountFilters: (f: Partial<AccountFilters>) => void;
  clearAccountFilters: () => void;
}

const defaultFilters: AccountFilters = {
  page: 1,
  per_page: 20,
};

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
  accountFilters: defaultFilters,
  setAccountFilters: (f) =>
    set((s) => ({ accountFilters: { ...s.accountFilters, ...f } })),
  clearAccountFilters: () => set({ accountFilters: defaultFilters }),
}));
