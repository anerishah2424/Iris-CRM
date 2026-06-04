import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/config/api';
import type { User } from '@/types/user';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: 'matrix_manager' | 'Sales_manager' | null;
  zoneId: number | null;
  zoneName: string | null;
  selectedZoneId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  setSelectedZone: (zoneId: number | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      zoneId: null,
      zoneName: null,
      selectedZoneId: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { username, password });
          // The backend returns { data: { access_token, refresh_token, user, zone }, ... }
          const { access_token, refresh_token, user } = res.data.data;
          
          set({
            accessToken: access_token,
            refreshToken: refresh_token,
            user,
            role: user?.role,
            zoneId: user?.zone_id,
            zoneName: user?.zone_name || res.data.data.zone?.name,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          role: null,
          zoneId: null,
          zoneName: null,
          selectedZoneId: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');
        const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
        // Response is { data: { access_token: "..." }, ... }
        set({ accessToken: res.data.data.access_token });
      },

      setSelectedZone: (zoneId: number | null) => {
        set({ selectedZoneId: zoneId });
      },
    }),
    {
      name: 'iris-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        role: state.role,
        zoneId: state.zoneId,
        zoneName: state.zoneName,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
