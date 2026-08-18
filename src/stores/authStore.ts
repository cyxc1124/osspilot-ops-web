import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MeResponse, UserBrief } from '../api/types';

interface AuthState {
  token: string | null;
  user: UserBrief | null;
  setAuth: (token: string, user: UserBrief) => void;
  setUser: (user: MeResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) =>
        set({
          user: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            roles: user.roles,
            must_change_password: user.must_change_password,
          },
        }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'osspilot-ops-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
